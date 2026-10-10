import type { PoseKeypoint, PoseData } from "./types"

/**
 * Calculate the angle between three points in degrees
 */
export function calculateAngle(a: PoseKeypoint, b: PoseKeypoint, c: PoseKeypoint): number {
  // Calculate vectors
  const vectorAB = {
    x: b.x - a.x,
    y: b.y - a.y,
    z: b.z - a.z,
  }

  const vectorCB = {
    x: b.x - c.x,
    y: b.y - c.y,
    z: b.z - c.z,
  }

  // Calculate dot product
  const dotProduct = vectorAB.x * vectorCB.x + vectorAB.y * vectorCB.y + vectorAB.z * vectorCB.z

  // Calculate magnitudes
  const magnitudeAB = Math.sqrt(vectorAB.x * vectorAB.x + vectorAB.y * vectorAB.y + vectorAB.z * vectorAB.z)
  const magnitudeCB = Math.sqrt(vectorCB.x * vectorCB.x + vectorCB.y * vectorCB.y + vectorCB.z * vectorCB.z)

  // Calculate angle
  const cosTheta = dotProduct / (magnitudeAB * magnitudeCB)

  // Handle numerical precision issues
  const clampedCosTheta = Math.min(Math.max(cosTheta, -1), 1)

  // Convert to degrees
  return Math.acos(clampedCosTheta) * (180 / Math.PI)
}

/**
 * Calculate the Euclidean distance between two keypoints
 */
export function calculateDistance(a: PoseKeypoint, b: PoseKeypoint): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))
}

/**
 * Calculate similarity between two poses (0-1)
 */
export function calculatePoseSimilarity(poseA: PoseData, poseB: PoseData): number {
  if (!poseA || !poseB || !poseA.keypoints || !poseB.keypoints) {
    return 0
  }

  let validPointCount = 0
  let totalSimilarity = 0

  // Create map for faster lookup
  const keypointsMapB = new Map<string, PoseKeypoint>()
  poseB.keypoints.forEach((kp) => keypointsMapB.set(kp.name, kp))

  // Compare keypoints
  for (const keypointA of poseA.keypoints) {
    const keypointB = keypointsMapB.get(keypointA.name)

    if (keypointB && keypointA.score > 0.5 && keypointB.score > 0.5) {
      const distance = calculateDistance(keypointA, keypointB)

      // Normalize distance (closer to 0 is better)
      // We consider a normalized distance of 0.3 as the maximum reasonable difference
      const similarity = Math.max(0, 1 - distance / 0.3)

      totalSimilarity += similarity
      validPointCount++
    }
  }

  return validPointCount > 0 ? totalSimilarity / validPointCount : 0
}

/**
 * Normalize keypoints to be in the range [0, 1]
 */
export function normalizeKeypoints(keypoints: PoseKeypoint[], width: number, height: number): PoseKeypoint[] {
  return keypoints.map((kp) => ({
    ...kp,
    x: kp.x / width,
    y: kp.y / height,
  }))
}

/**
 * Filter keypoints based on confidence score
 */
export function filterKeypoints(keypoints: PoseKeypoint[], minScore = 0.5): PoseKeypoint[] {
  return keypoints.filter((kp) => kp.score >= minScore)
}

/**
 * Get keypoint connections for visualization
 */
export function getKeypointConnections(): [string, string][] {
  return [
    // Face
    ["nose", "left_eye_inner"],
    ["left_eye_inner", "left_eye"],
    ["left_eye", "left_eye_outer"],
    ["left_eye_outer", "left_ear"],
    ["nose", "right_eye_inner"],
    ["right_eye_inner", "right_eye"],
    ["right_eye", "right_eye_outer"],
    ["right_eye_outer", "right_ear"],
    ["mouth_left", "mouth_right"],

    // Upper body
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["right_shoulder", "right_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_elbow", "right_wrist"],

    // Torso
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],

    // Lower body
    ["left_hip", "left_knee"],
    ["right_hip", "right_knee"],
    ["left_knee", "left_ankle"],
    ["right_knee", "right_ankle"],

    // Feet
    ["left_ankle", "left_heel"],
    ["left_heel", "left_foot_index"],
    ["right_ankle", "right_heel"],
    ["right_heel", "right_foot_index"],
  ]
}
