import { mockUsers, mockWorkoutPlans } from "./mock-user-data"
import { getCollaborativeFilteringRecommendations, getEnhancedRecommendations } from "./collaborative-filtering"

export function getAllWorkoutPlans() {
  return mockWorkoutPlans
}

export function getWorkoutPlanById(planId: string) {
  return mockWorkoutPlans.find((plan) => plan.id === planId)
}

export function getAllUserProfiles() {
  return mockUsers
}

export function getDiverseRecommendations(
  userProfile: UserProfile,
  currentWorkout = null,
  topN = 4,
): WorkoutRecommendation[] {
  if (!userProfile) {
    return []
  }

  // If we have a current workout, use enhanced recommendations
  if (currentWorkout) {
    return getEnhancedRecommendations(userProfile, currentWorkout, mockUsers, mockWorkoutPlans, topN)
  }

  // Otherwise, use standard collaborative filtering
  return getCollaborativeFilteringRecommendations(userProfile, mockUsers, mockWorkoutPlans, topN)
}

export interface UserProfile {
  id: string
  name: string
  gender: string
  age: number
  fitnessLevel?: string
  weight: string
  preferredEquipment: string[]
  preferredMuscleGroups: string[]
  completedWorkouts: CompletedWorkout[]
  ratings: WorkoutRating[]
  lastUpdated?: number
}

export interface CompletedWorkout {
  id: string
  date: string
  workoutPlanId: string
  duration: number
  muscleGroups: string[]
  difficulty: string
}

export interface WorkoutRating {
  workoutPlanId: string
  rating: number
  timestamp: number
  feedback?: string
}

export interface WorkoutRecommendation {
  id: string
  score: number
  reason: string
  muscleGroups: string[]
  equipment: string[]
  difficulty: string
  duration: number
  source: "collaborative" | "content-based" | "popular"
  name: string
}

export function createUserProfile(formData: any, userId = `user_${Date.now()}`): UserProfile {
  return {
    id: userId,
    name: formData.name,
    gender: formData.gender,
    age: Number.parseInt(formData.age || "25"),
    weight: formData.weight,
    fitnessLevel: formData.difficulty || "intermediate",
    preferredEquipment: formData.equipment,
    preferredMuscleGroups: formData.muscleGroups,
    completedWorkouts: [],
    ratings: [],
    lastUpdated: Date.now(),
  }
}

export function addWorkoutRating(
  userProfile: UserProfile,
  workoutPlanId: string,
  rating: number,
  feedback?: string,
): UserProfile {
  const updatedProfile = { ...userProfile }

  const existingRatingIndex = updatedProfile.ratings.findIndex((r) => r.workoutPlanId === workoutPlanId)

  if (existingRatingIndex >= 0) {
    updatedProfile.ratings[existingRatingIndex] = {
      ...updatedProfile.ratings[existingRatingIndex],
      rating,
      feedback,
      timestamp: Date.now(),
    }
  } else {
    updatedProfile.ratings.push({
      workoutPlanId,
      rating,
      feedback,
      timestamp: Date.now(),
    })
  }

  updatedProfile.lastUpdated = Date.now()

  return updatedProfile
}

export function addCompletedWorkout(userProfile: UserProfile, workout: CompletedWorkout): UserProfile {
  const updatedProfile = {
    ...userProfile,
    completedWorkouts: [...userProfile.completedWorkouts, workout],
    lastUpdated: Date.now(),
  }

  return updatedProfile
}
