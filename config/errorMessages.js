const error = {
  incompleteData:
    "We cannot process your request with incomplete data. Try again. If error persists please contact our customer support.",

  userNotFound:
    "Your account record was not found in our database. If you already have an account but experiences this error please contact our customer support.",

  productNotFound:
    "It seems that this product is not available at the moment. The seller might have remove the item. Please try again later.",

  emailNotFound:
    "This email seems to be not in our account records. Please enter an email that you have used to login to COMERCE.",

  serverError:
    "We're very sorry but something went wrong in our system. Please try again. If errors persist please contact our customer support.",

  invalidCredentials:
    "You have entered invalid credentials, email and password can't be found.",

  emailTaken:
    "Hi, it appears that your email is already registered. If you forgot your account password, you may proceed to reset your password through email. Please go to /password/reset",

  invalidResetPasswordToken:
    "It seems that your reset password request is invalid. To avoid this error, only use the reset password link from the email within 15 minutes.",

  incorrectOldPassword: "Password does not match your current password.",
};
exports.error = error;

/*
200 - successful get request or any database retrieval
201 - successful database modification, creation, etc.
406 - incomplete request data
404 - search data not found (product, user, etc.)
500 - all unexpected error in the server
 */
