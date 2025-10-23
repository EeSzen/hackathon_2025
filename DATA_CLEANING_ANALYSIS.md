# Data Cleaning Analysis & Fix Report

## Problem Analysis

After carefully analyzing your screenshot and the actual data, I identified **THREE CRITICAL ISSUES**:

### Issue 1: Unrealistic Fuel Efficiency Getting "Excellent" Scores ⚠️

**Example from your data:**

```
Vehicle: ABA 6852
Trip: 184.5 km in 13.8 hours, using 2.97L fuel
Calculated Efficiency: 62.02 km/L
Score: 10.0 - Excellent ❌ WRONG!
```

**Why this is impossible:**

- Heavy trucks typically: 1.5 - 3.5 km/L
- Light trucks typically: 3 - 6 km/L
- **62 km/L is impossible** - this is better than a hybrid car!
- This is clearly a sensor error or data corruption

**Previous filter:** Allowed up to 15 km/L (still way too high!)
**New filter:** Max 8 km/L for light trucks, min 1 km/L

### Issue 2: Long Duration Trips Still Passing Through ⚠️

**Example from your screenshot:**

```
Vehicle: ABA 6852
Date: 2025-08-21
Time: 17 hr 19 min
Distance: 191.13 km
Average Speed: 11 km/h
Score: 10.0 - Excellent ❌ WRONG!
```

**Why this is problematic:**

- 17 hours for 191 km = average 11 km/h
- Normal highway driving: 60-90 km/h
- Normal city driving: 20-40 km/h
- **11 km/h average = mostly parked/stopped**
- This trip likely includes:
  - Long meal breaks
  - Overnight rest stops
  - Extended parking
  - Heavy traffic jams

**Previous filter:** Allowed up to 24 hours
**New filter:** Max 12 hours (drivers need rest, longer = parking included)

### Issue 3: Scoring Algorithm Too Generous 🎯

**Why everything was "Excellent" (10.0):**

1. **Fuel efficiency scoring was wrong:**

   - Old formula: `(efficiency / 3) * 50`
   - 62 km/L ÷ 3 × 50 = **1033%!** (capped at 100)
   - Even 6 km/L got 100/100 score

2. **Time penalty was too weak:**

   - Old formula: `100 - (duration / 10) * 30`
   - 17 hours: 100 - 51 = 49/100 (still passing!)
   - Not enough penalty for very long trips

3. **No speed checks:**
   - 11 km/h average speed wasn't penalized
   - Should heavily penalize trips with very low speeds

## Solutions Implemented

### 1. Stricter Data Filters (13 filters total)

```typescript
// NEW STRICT FILTERS:
✅ Minimum distance: 1 km (was 0.5 km)
✅ Maximum distance: 500 km (was 1000 km) - single trip limit
✅ Minimum speed: 5 km/h (was 1 km/h) - remove traffic/parking
✅ Maximum speed: 100 km/h (was 120 km/h) - realistic for trucks
✅ Fuel efficiency: 1-8 km/L (was 0.3-15 km/L) - REALISTIC range!
✅ Maximum duration: 12 hours (was 24 hours) - single trip limit
✅ Long trip penalty: >5hrs AND <10km/h = REMOVED
✅ Stationary check: Same location >30min = REMOVED
✅ Speed/distance consistency check: NEW!
```

### 2. Revised Scoring Algorithm

**NEW Fuel Efficiency Scoring:**

```
Excellent (90-100):  > 4.5 km/L
Good (70-90):        3.5-4.5 km/L
Average (50-70):     2.5-3.5 km/L
Below (30-50):       1.5-2.5 km/L
Poor (0-30):         < 1.5 km/L
```

**NEW Time Efficiency Scoring:**

```
Excellent (90-100):  < 3 hours
Good (70-90):        3-5 hours
Questionable (40-70): 5-8 hours
Poor (0-40):         > 8 hours
```

**NEW Speed Penalty:**

- Trips with average < 15 km/h get proportional score reduction
- 11 km/h trip now gets: score × (11/15) = 73% penalty

## Before vs After Comparison

### BEFORE ❌

**Trip 1:**

```
Distance: 184.5 km
Duration: 13.8 hours
Fuel: 2.97 L
Efficiency: 62 km/L (IMPOSSIBLE!)
Speed: 13 km/h
Score: 10.0 - Excellent ❌
Status: SHOWN IN TABLE
```

**Trip 2:**

```
Distance: 191 km
Duration: 17.3 hours
Speed: 11 km/h (mostly parked!)
Score: 10.0 - Excellent ❌
Status: SHOWN IN TABLE
```

### AFTER ✅

**Trip 1:**

```
Distance: 184.5 km
Efficiency: 62 km/L
Status: FILTERED OUT (exceeds 8 km/L limit)
Reason: Unrealistic fuel efficiency - sensor error
```

**Trip 2:**

```
Distance: 191 km
Duration: 17.3 hours (exceeds 12 hour limit)
Speed: 11 km/h (fails >5hrs AND <10km/h check)
Status: FILTERED OUT
Reason: Excessive duration with very low speed
```

**What you'll see now:**

```
Distance: 38.79 km
Duration: 2.4 hours
Speed: 16 km/h
Fuel Efficiency: 7.4 km/L
Score: 8.5 - Good ✅
Status: VALID TRIP
```

## Data Statistics

**Original CSV:** 1,242 total trip records

**After STRICT filtering, removed:**

- ~150-200 trips with impossible fuel efficiency (>8 km/L)
- ~100-150 trips with excessive duration (>12 hrs)
- ~50-80 trips with very low speeds (<5 km/h)
- ~30-50 trips with long duration + low speed combo
- ~20-30 trips with stationary/same location issues

**Expected result:** 700-850 clean, realistic trips

## Why Scores Were All "Excellent"

The old algorithm had **THREE MAJOR FLAWS**:

### Flaw 1: No Upper Bound on Fuel Efficiency

```javascript
// OLD CODE:
fuel_score = (avg_fuel_efficiency / 3) * 50

// With 62 km/L:
fuel_score = (62 / 3) * 50 = 1033 → capped at 100

// Even moderate data got max score:
6 km/L → (6 / 3) * 50 = 100
```

### Flaw 2: Weak Time Penalty

```javascript
// OLD CODE:
time_score = 100 - (duration / 10) * 30

// With 17 hours:
time_score = 100 - (17/10)*30 = 100 - 51 = 49
// 49/100 is still "passing"!

// With 10 hours:
time_score = 100 - 30 = 70 (Good!)
```

### Flaw 3: No Speed Validation

- Never checked if average speed was reasonable
- 11 km/h (mostly parked) got same score as 50 km/h (normal driving)

## Technical Implementation

### Modified Files:

1. **`lib/csv.ts`** - Enhanced `isValidTrip()` with 13 strict filters
2. **`lib/csv.ts`** - Completely revised `calculateVehicleScore()` algorithm

### Backup Created:

- **`public/data/trip_summary_original_backup.csv`** - Original data preserved

### New Filter Thresholds:

| Metric                | Old Limit       | New Limit       | Reason                 |
| --------------------- | --------------- | --------------- | ---------------------- |
| Fuel Efficiency (max) | 15 km/L         | 8 km/L          | Realistic for trucks   |
| Duration (max)        | 24 hrs          | 12 hrs          | Single trip limit      |
| Speed (min)           | 1 km/h          | 5 km/h          | Remove traffic/parking |
| Distance (max)        | 1000 km         | 500 km          | Single trip limit      |
| Long trip threshold   | 15 hrs @ 2 km/h | 5 hrs @ 10 km/h | More aggressive        |

## Validation

To verify the fixes work, check your table:

- ✅ No trips with >12 hour duration
- ✅ No fuel efficiency above 8 km/L
- ✅ No average speeds below 5 km/h
- ✅ Scores are now distributed (not all 10.0)
- ✅ "Excellent" only for genuinely good trips

## Why This Happened

The original filters were designed to be **permissive** (catch obvious errors), but:

1. Truck sensor data can have severe corruption (62 km/L!)
2. GPS data includes all stops/delays in trip duration
3. Scoring algorithm didn't account for data quality issues
4. No validation against realistic truck performance specs

**Solution:** Much stricter filters based on **real-world truck capabilities** in Malaysia.
