import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import { USER } from "../models/user.models.js";
import { DETAILS } from "../models/details.models.js";
import { asyncHandler } from "../utils/handler.utils.js";
import { SuccessResponse, ErrorResponse } from "../utils/responses.utils.js";
import { OTP } from "../models/otp.models.js";
import { mailer } from "../utils/mailer.utils.js";

const sendVerificationOTP = async (email) => {
    try {
        let otp = otpGenerator.generate(6, {
            lowerCaseAlphabets: false,
            specialChars: false,
            upperCaseAlphabets: false
        })
    
        let otpRes = await OTP.findOne({ otp });
        while (otpRes) {
            otp = otpGenerator.generate(6, {
                lowerCaseAlphabets: false,
                specialChars: false,
                upperCaseAlphabets: false
            })
    
            otpRes = await OTP.findOne({ otp });
        }
    
        await OTP.create({ email, otp });

    } catch (error) {
        console.log("Error in sending verification otp");
        console.log(error);
    }
}


const register = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return ErrorResponse(res, 400, "Fill all the required fields");
    }

    const user = await USER.findOne({ email });
    if (user) {
        return ErrorResponse(res, 400, "Account already exists");
    }

    await sendVerificationOTP(email);

    return SuccessResponse(res, `A verification otp has been sent to your email`);
});

const confirmRegistration = asyncHandler(async (req, res) => {
    const { fullName, email, password, otp } = req.body;

    const recentOTP = await OTP.findOne({ email }).sort({ createdAt : -1 }).limit(1);

    if (!recentOTP) {
        return ErrorResponse(res, 400, "OTP expired. Try again.");
    } else if (otp !== recentOTP.otp) {
        return ErrorResponse(res, 400, "Entered otp is wrong"); 
    }

    const details = await DETAILS.create({ fullName });
    await USER.create({ email, password, verified: true, details: details._id });

    return SuccessResponse(res, `You have been registered successfully`);
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return ErrorResponse(res, 400, "All required fields must be filled to log in");
    }

    const user = await USER.findOne({ email });
    if (!user) {
        return ErrorResponse(res, 404, "Account does not exists");
    }

    const correctPassword = await user.validatePassword(password);
    if (!correctPassword) {
        return ErrorResponse(res, 401, "Password is incorrect");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
        success: true,
        message: "Logged in",
        accessToken,
        refreshToken
    });
});

const logout = asyncHandler(async (req, res) => {
    await USER.findByIdAndUpdate(req.user?._id, {refreshToken: ""});

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
        success: true,
        message: "Logged out"
    });
});

const refreshTokens = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        return ErrorResponse(res, 401, "Unauthorised request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await USER.findById(decodedToken?._id);
    if (!user) {
        return ErrorResponse(res, 400, "Session expired. Login again.");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        return ErrorResponse(res, 401, "Refresh access token is expired. Login again");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    const options = {
        httpOnly : true,
        secure : true
    };

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
        succes: true,
        message: "Logged in",
        user,
        accessToken,
        refreshToken
    });
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return ErrorResponse(res, 400, "Password does not match");
    }

    const user = await USER.findById(req.user?._id);

    const passwordCorrect = await user.validatePassword(oldPassword);
    if (!passwordCorrect) {
        return ErrorResponse(res, 400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return SuccessResponse(res, "Password changed successfully");
});


export { 
    register,
    confirmRegistration,
    login,
    logout,
    changePassword,
    refreshTokens,
};