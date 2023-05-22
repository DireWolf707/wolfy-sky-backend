import { catchAsync } from "../utils"
import { db, storage } from "../configs"
import { userT, tweetT, notificationT, followT } from "../drizzle/schema"
import { mediaInput } from "../validators"
import { io } from "../socket"

export const getFeed = catchAsync(async (req, res) => {})

export const getTweet = catchAsync(async (req, res) => {})

export const getPublicProfile = catchAsync(async (req, res) => {})

export const getNotifications = catchAsync(async (req, res) => {})

export const tweet = catchAsync(async (req, res) => {})

export const like = catchAsync(async (req, res) => {})

export const unlike = catchAsync(async (req, res) => {})

export const comment = catchAsync(async (req, res) => {})



