const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //create a transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "2f54e9fa6db715",
      pass: "0963c73aeaa075",
    },
  });
  //define the email options
  const mailOptions = {
    from: "andrea <myself@io.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html: ...
  };
  //send the email with nodemailer
  console.log("sending email");
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
