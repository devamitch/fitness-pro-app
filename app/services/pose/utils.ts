import type { PoseKeypoint, PoseData } from "./types"

// Calculate angle between three points
export function calculateAngle(a: PoseKeypoint, b: PoseKeypoint, c: PoseKeypoint): number {
  const ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
  const bc = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2))
  const ac = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2))

  const angleRad = Math.acos((ab * ab + bc * bc - ac * ac) / (2 * ab * bc))
  return angleRad * (180 / Math.PI) // Convert to degrees
}

// Calculate distance between two points
export function calculateDistance(a: PoseKeypoint, b: PoseKeypoint): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) + Math.pow(b.z - a.z, 2))
}

// Calculate similarity between two poses
export function calculatePoseSimilarity(pose1: PoseData, pose2: PoseData): number {
  if (!pose1 || !pose2 || !pose1.keypoints || !pose2.keypoints) {
    return 0
  }

  const keypoints1 = pose1.keypoints
  const keypoints2 = pose2.keypoints

  // Create maps for quick lookup
  const keypointMap1 = new Map<string, PoseKeypoint>()
  const keypointMap2 = new Map<string, PoseKeypoint>()

  keypoints1.forEach((kp) => keypointMap1.set(kp.name, kp))
  keypoints2.forEach((kp) => keypointMap2.set(kp.name, kp))

  // Calculate similarity for each keypoint
  let totalSimilarity = 0
  let totalWeight = 0

  // Get common keypoint names
  const keypointNames = Array.from(
    new Set(
      [...keypointMap1.keys(), ...keypointMap2.keys()].filter(
        (name) => keypointMap1.has(name) && keypointMap2.has(name),
      ),
    ),
  )

  keypointNames.forEach((name) => {
    const kp1 = keypointMap1.get(name)
    const kp2 = keypointMap2.get(name)

    if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
      // Calculate distance (normalized)
      const distance = calculateDistance(kp1, kp2)

      // Convert to similarity (1 - normalized distance)
      const similarity = Math.max(0, 1 - distance * 5) // Scale factor of 5 to make it more sensitive

      // Weight by average confidence
      const weight = (kp1.score + kp2.score) / 2

      totalSimilarity += similarity * weight
      totalWeight += weight
    }
  })

  return totalWeight > 0 ? totalSimilarity / totalWeight : 0
}

// Normalize keypoints to a standard coordinate system
export function normalizeKeypoints(keypoints: PoseKeypoint[], width: number, height: number): PoseKeypoint[] {
  return keypoints.map((kp) => ({
    ...kp,
    x: kp.x / width,
    y: kp.y / height,
  }))
}

// Filter keypoints by confidence threshold
export function filterKeypoints(keypoints: PoseKeypoint[], threshold = 0.5): PoseKeypoint[] {
  return keypoints.filter((kp) => kp.score >= threshold)
}
