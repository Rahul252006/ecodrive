import sys
import os
import json
import joblib
import pandas as pd
import numpy as np

def main():
  try:
    # 1. Parse JSON input from stdin or argument
    if len(sys.argv) > 1:
      input_data = json.loads(sys.argv[1])
    else:
      input_data = json.load(sys.stdin)

    distance_km = float(input_data.get('distanceKm', 10.0))
    duration_min = float(input_data.get('durationMin', 15.0))
    avg_speed_kmh = float(input_data.get('avgSpeedKmh', distance_km / (duration_min / 60.0) if duration_min > 0 else 40.0))
    max_speed_kmh = float(input_data.get('maxSpeedKmh', avg_speed_kmh * 1.25))
    idle_time_min = float(input_data.get('idleTimeMin', 0.0))
    hard_accel_count = float(input_data.get('hardAccelerationCount', 0.0))
    hard_brake_count = float(input_data.get('hardBrakingCount', 0.0))
    elevation_gain_m = float(input_data.get('elevationGainM', 20.0))

    # Feature Engineering
    idle_ratio = idle_time_min / max(0.1, duration_min)
    accel_density = hard_accel_count / max(0.1, distance_km)
    brake_density = hard_brake_count / max(0.1, distance_km)
    speed_ratio = max_speed_kmh / max(1.0, avg_speed_kmh)

    feature_cols = [
      'distance_km', 'duration_min', 'avg_speed_kmh', 'max_speed_kmh',
      'idle_ratio', 'accel_density', 'brake_density', 'elevation_gain_m'
    ]

    features_df = pd.DataFrame([{
      'distance_km': distance_km,
      'duration_min': duration_min,
      'avg_speed_kmh': avg_speed_kmh,
      'max_speed_kmh': max_speed_kmh,
      'idle_ratio': idle_ratio,
      'accel_density': accel_density,
      'brake_density': brake_density,
      'elevation_gain_m': elevation_gain_m
    }])[feature_cols]

    # Load Model Artifact
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'eco_driving_model.joblib')

    if not os.path.exists(model_path):
      # Fallback model prediction formula if joblib not found
      predicted_fuel_l = (distance_km / 13.5) * (1.0 + 0.4 * idle_ratio + 0.5 * accel_density + 0.3 * brake_density)
      model_name = "Analytical Fallback Baseline Model"
    else:
      model = joblib.load(model_path)
      prediction = model.predict(features_df)[0]
      predicted_fuel_l = max(0.05, float(prediction))
      model_name = "Trained ML Model (eco_driving_model.joblib)"

    predicted_fuel_l = round(predicted_fuel_l, 2)

    result = {
      "success": True,
      "mlModelName": model_name,
      "mlPredictedFuelL": predicted_fuel_l,
      "features": {
        "distanceKm": distance_km,
        "durationMin": duration_min,
        "idleRatio": round(idle_ratio, 3),
        "accelDensity": round(accel_density, 3),
        "brakeDensity": round(brake_density, 3),
        "speedRatio": round(speed_ratio, 3)
      }
    }

    print(json.dumps(result))

  except Exception as e:
    err_res = {
      "success": False,
      "error": str(e)
    }
    print(json.dumps(err_res))
    sys.exit(1)

if __name__ == '__main__':
  main()
