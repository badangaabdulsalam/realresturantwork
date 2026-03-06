const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

function loadEnvFile() {
    const envFilePath = path.join(__dirname, '.env');

    try {
        const raw = fsSync.readFileSync(envFilePath, 'utf8');
        const lines = raw.split(/\r?\n/);

        for (const line of lines) {
            const trimmed = String(line || '').trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex <= 0) continue;

            const key = trimmed.slice(0, separatorIndex).trim();
            let value = trimmed.slice(separatorIndex + 1).trim();
            if (!key) continue;

            if (
                (value.startsWith('"') && value.endsWith('"'))
                || (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            throw error;
        }
    }
}

function getSupabaseConfig() {
    const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const schema = String(process.env.SUPABASE_SCHEMA || 'public').trim();
    const stateTable = String(process.env.SUPABASE_STATE_TABLE || 'app_state').trim();

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env first.');
    }

    return {
        supabaseUrl,
        serviceKey,
        schema,
        stateTable
    };
}

function buildHeaders(config) {
    return {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': config.schema,
        Prefer: 'resolution=merge-duplicates,return=minimal'
    };
}

async function readJson(filePath, fallback) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed;
    } catch {
        return fallback;
    }
}

async function upsertState(config, key, value) {
    const response = await fetch(
        `${config.supabaseUrl}/rest/v1/${config.stateTable}?on_conflict=key`,
        {
            method: 'POST',
            headers: buildHeaders(config),
            body: JSON.stringify([{ key, value }])
        }
    );

    if (!response.ok) {
        let details = '';
        try {
            const data = await response.json();
            details = data?.message || data?.details || data?.hint || '';
        } catch {
            details = '';
        }

        throw new Error(`Upsert failed for ${key} (HTTP ${response.status})${details ? `: ${details}` : ''}`);
    }
}

async function ensureStateTableExists(config) {
    const response = await fetch(
        `${config.supabaseUrl}/rest/v1/${config.stateTable}?select=key&limit=1`,
        {
            method: 'GET',
            headers: {
                apikey: config.serviceKey,
                Authorization: `Bearer ${config.serviceKey}`,
                'Accept-Profile': config.schema
            }
        }
    );

    if (!response.ok) {
        let details = '';
        try {
            const data = await response.json();
            details = data?.message || data?.details || data?.hint || '';
        } catch {
            details = '';
        }

        if (response.status === 404) {
            throw new Error(
                `Supabase table '${config.schema}.${config.stateTable}' is missing. Run server/supabase-schema.sql in Supabase SQL Editor first.`
            );
        }

        throw new Error(`Table check failed (HTTP ${response.status})${details ? `: ${details}` : ''}`);
    }
}

async function main() {
    loadEnvFile();
    const config = getSupabaseConfig();
    await ensureStateTableExists(config);

    const users = await readJson(path.join(__dirname, 'users-db.json'), { version: 1, users: [] });
    const orders = await readJson(path.join(__dirname, 'orders-db.json'), { version: 1, orders: [] });

    const normalizedUsers = {
        version: Number(users?.version || 1),
        users: Array.isArray(users?.users) ? users.users : []
    };

    const normalizedOrders = {
        version: Number(orders?.version || 1),
        orders: Array.isArray(orders?.orders) ? orders.orders : []
    };

    await upsertState(config, 'users', normalizedUsers);
    await upsertState(config, 'orders', normalizedOrders);

    console.log(`Migrated ${normalizedUsers.users.length} users and ${normalizedOrders.orders.length} orders to Supabase.`);
}

main().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
});
