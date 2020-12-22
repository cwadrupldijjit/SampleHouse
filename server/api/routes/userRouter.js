const router = require("express").Router();
const userDb = require("../../../database/model/userModel");
const tokenDb = require("../../../database/model/tokenModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const {
    v1: uuidv1
} = require('uuid');
const {
    body,
    validationResult
} = require('express-validator');


const {
    SENDGRID_USERNAME,
    SENDGRID_PASSWORD,
    JWT_SECRET = "not a secret",
} = process.env;

const {
    checkExistingUsers
} = require("../middleware/userMiddleware");

// todo validateSubscription for login

router.post("/register",
    //* validate email and password
    [body('email').isEmail().normalizeEmail(),
        body('password').isLength({
            min: 6
        })
    ],
    checkExistingUsers, (req, res) => {
        //todo email validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).send(errors.array());
        const {
            email,
            password
        } = req.body;
        const hash = bcrypt.hashSync(password, 13);
        const user = {
            id: uuidv1(),
            email: email,
            password: hash,
        }
        //* Create validation token
        const token = {
            userId: user.id,
            token: crypto.randomBytes(16).toString('hex')
        }
        //! transporter and mail options
        // todo check other smtp mail servers (SendinBlue)
        const mailClient = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: SENDGRID_USERNAME,
                pass: SENDGRID_PASSWORD
            }
        });
        const emailTemplate = {
            // todo change FROM to a no-reply@company.com
            from: 'no-reply@bluesmokemedia.net',
            to: user.email,
            subject: 'Craig VST Account Verification Token',
            text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n'
        };

        userDb
            .insert(user)
            .then(([newUser]) => {
                tokenDb.insert(token).catch(err => res.status(500).send(err))
                //* Send verification email

                mailClient.sendMail(emailTemplate, (err, info) => {
                    if (err) return res.status(500).send({
                        msg: err.message,
                    });
                    return res.status(200).send({
                        msg: 'A verification email has been sent to ' + user.email + '.  ',
                        info: info
                    });
                });
            })
            .catch((err) =>
                res.status(500).json(err)
            );
    });
// todo forgot password
// todo validateHeaders middleware
//todo logging in from VST? (Header?)
router.post("/login",
    [body('email').isEmail().normalizeEmail()], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).send(errors.array());

        const {
            email,
            password
        } = req.body;

        userDb
            .getUserByEmail(email)
            .then(([user]) => {
                if (!user) return res.status(403).json({
                    msg: 'The email address ' + req.body.email + ' is not associated with any account. Please double-check your email address and try again.'
                });
                //* Check password
                if (!bcrypt.compareSync(password, user.password)) {
                    res.status(403).json({
                        errormsg: "Invalid credentials"
                    });
                }
                //* Check user has verified email
                if (!user.isVerified) return res.status(401).send({
                    type: 'not-verified',
                    msg: 'Your account has not been verified.'
                });
                //* Login successful, write token, and send back user
                user.token = generateToken(user);
                res.status(200).json(user);
            })
            .catch((err) => res.status(500).json({
                errormsg: "unable to retrieve user",
                error: err,
            }))
    });


//todo validate w/ token in login?

router.use("/", (req, res) => {
    res.status(200).json({
        Route: "User Route"
    });
});

module.exports = router;

function generateToken(user) {
    const payload = {
        subject: user.id,
        username: user.username,
    };
    // const secret = JWT_SECRET || "not a secret";
    const options = {
        expiresIn: "72h",
    };
    return jwt.sign(payload, JWT_SECRET, options);
}
