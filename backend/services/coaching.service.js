function generateCoaching(trip, scoreBreakdown, historicalAvgScore = null) {
  const recommendations = [];
  const distanceKm = Number(trip.distanceKm) || 1;
  const durationMin = Number(trip.durationMin) || 1;
  const hardAcc = Number(trip.hardAccelerationCount) || 0;
  const hardBrake = Number(trip.hardBrakingCount) || 0;
  const idleTimeMin = Number(trip.idleTimeMin) || 0;
  const idleRatio = idleTimeMin / durationMin;

  if (hardAcc > 0) {
    if (hardAcc / distanceKm > 0.2) {
      recommendations.push('High frequency of rapid accelerations detected. Ease gently onto the throttle to conserve fuel and protect vehicle components.');
    } else {
      recommendations.push('Smooth out your initial acceleration from stops for better fuel economy.');
    }
  }

  if (hardBrake > 0) {
    if (hardBrake / distanceKm > 0.2) {
      recommendations.push('Multiple hard braking events observed. Increase your following distance and scan further ahead to coast to a gradual stop.');
    } else {
      recommendations.push('Anticipate traffic flow earlier to minimize sudden braking.');
    }
  }

  if (idleRatio > 0.15) {
    recommendations.push(`Idling accounted for ${Math.round(idleRatio * 100)}% of trip time. Turn off the engine during extended stops over 60 seconds.`);
  }

  if (scoreBreakdown.speedConsistency < 70) {
    recommendations.push('Maintain a steady speed when cruising. Frequent speed fluctuations increase overall fuel consumption.');
  }

  if (historicalAvgScore !== null) {
    if (scoreBreakdown.ecoScore >= historicalAvgScore + 5) {
      recommendations.push(`Great job! This trip scored ${scoreBreakdown.ecoScore - historicalAvgScore} points higher than your personal historical baseline.`);
    } else if (scoreBreakdown.ecoScore <= historicalAvgScore - 5) {
      recommendations.push(`This trip scored below your average of ${historicalAvgScore}. Pay extra attention to smooth braking and idling on your next run.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent eco-driving performance! Smooth acceleration and steady speeds kept your efficiency optimal.');
  }

  return recommendations;
}

module.exports = { generateCoaching };
