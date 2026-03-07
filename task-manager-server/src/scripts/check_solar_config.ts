/**
 * Script to check solar_config table records
 *
 * This script will:
 * 1. Connect to the database
 * 2. Run 'SELECT * FROM solar_config'
 * 3. Report the number of records
 * 4. Check if username/password are present
 */

import { initDb, prepare } from '../database/db';

async function checkSolarConfig() {
    try {
        // Initialize database
        await initDb();
        console.log('Database initialized successfully.\n');

        // Query solar_config table using SELECT * FROM solar_config
        const records = prepare('SELECT * FROM solar_config').all();

        console.log('='.repeat(60));
        console.log('SOLAR_CONFIG TABLE CHECK');
        console.log('='.repeat(60));
        console.log(`Total records: ${records.length}\n`);

        if (records.length === 0) {
            console.log('⚠️  NO RECORDS FOUND');
            console.log('');
            console.log('The solar_config table is empty.');
            console.log('You need to save the configuration first before using');
            console.log('the solar monitoring features.');
            console.log('');
            console.log('Please configure your Huawei FusionSolar credentials');
            console.log('through the application interface or use the update script.');
            console.log('='.repeat(60));
        } else {
            console.log('✅ RECORDS FOUND\n');

            records.forEach((record: any, index: number) => {
                console.log(`Record #${index + 1}:`);
                console.log('-'.repeat(60));
                console.log(`  ID: ${record.id}`);
                console.log(`  Username: ${record.username ? '✅ Present (' + record.username + ')' : '❌ Missing'}`);
                console.log(`  Password: ${record.password ? '✅ Present (*****)' : '❌ Missing'}`);
                console.log(`  Station DN: ${record.station_dn || 'Not set'}`);
                console.log(`  Session Cookies: ${record.session_cookies ? 'Present' : 'Not set'}`);
                console.log(`  Last Login: ${record.last_login || 'Never'}`);
                console.log(`  Created At: ${record.created_at}`);
                console.log(`  Updated At: ${record.updated_at}`);
                console.log('');
            });

            // Check if username and password are both present in the latest record
            const latestRecord = records[records.length - 1] as any;
            if (latestRecord.username && latestRecord.password) {
                console.log('✅ Both username and password are present in the latest configuration.');
            } else {
                console.log('⚠️  WARNING: Username or password is missing in the latest configuration.');
                if (!latestRecord.username) console.log('   - Username is missing');
                if (!latestRecord.password) console.log('   - Password is missing');
            }
            console.log('='.repeat(60));
        }

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error details:');
        console.error(error);
    }
}

// Run the script
checkSolarConfig();
