const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function cleanData() {
    console.log('=== CLEANING DATA WITH PAPAPARSE ===\n');
    console.log('Applying filters:');
    console.log('1. Remove: Zero distance (parked vehicles)');
    console.log('2. Remove: Distance < 0.5 km (not meaningful trips)');
    console.log('3. Remove: Duration = 0 (impossible)');
    console.log('6. Remove: Very long parking (> 24 hrs with < 10 km)\n');

    const inputFile = path.join(__dirname, 'trip_summary.csv');
    const outputFile = path.join(__dirname, 'safetruck-hackathon', 'public', 'data', 'trip_summary.csv');

    console.log('Reading:', inputFile);
    const text = fs.readFileSync(inputFile, 'utf-8');
    
    console.log('Parsing with Papa Parse...');
    const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });

    if (parsed.errors.length > 0) {
        console.warn('Parse warnings:', parsed.errors.slice(0, 3));
    }

    const rows = parsed.data;
    console.log(`\nOriginal rows: ${rows.length}`);

    let removedZeroDistance = 0;
    let removedShortDistance = 0;
    let removedZeroDuration = 0;
    let removedLongParking = 0;

    const validRows = rows.filter(row => {
        const distance = parseFloat(row.distance_km);
        const duration = parseFloat(row.duration_hr);
        const fuel = parseFloat(row.fuel_used_litre);

        // Filter 1: Remove zero distance
        if (distance === 0) {
            removedZeroDistance++;
            return false;
        }

        // Filter 2: Remove very short distance (< 0.5 km)
        if (distance < 0.5) {
            removedShortDistance++;
            return false;
        }

        // Filter 3: Remove zero duration
        if (duration === 0) {
            removedZeroDuration++;
            return false;
        }

        // Filter 6: Remove very long parking (> 24 hrs with < 10 km travel)
        if (duration > 24 && distance < 10) {
            removedLongParking++;
            return false;
        }

        return true;
    });

    console.log('\nRemoved breakdown:');
    console.log(`- Zero distance: ${removedZeroDistance}`);
    console.log(`- Short distance (< 0.5 km): ${removedShortDistance}`);
    console.log(`- Zero duration: ${removedZeroDuration}`);
    console.log(`- Long parking (> 24 hrs, < 10 km): ${removedLongParking}`);

    console.log('\n=== COMPLETE ===');
    console.log(`Valid rows: ${validRows.length}`);
    console.log(`Removed rows: ${rows.length - validRows.length}`);
    console.log(`Percentage kept: ${((validRows.length / rows.length) * 100).toFixed(2)}%`);

    // Write with Papa Parse to maintain proper CSV format
    const output = Papa.unparse(validRows, {
        header: true
    });

    fs.writeFileSync(outputFile, output, 'utf-8');
    console.log(`\nCleaned file saved to: ${outputFile}`);
}

cleanData();
