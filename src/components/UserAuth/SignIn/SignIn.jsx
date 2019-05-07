import React, { Component } from "react";
import { Link } from "react-router-dom";
import { ReCaptcha } from "react-recaptcha-v3";
import { Modal, Form, Input, Icon, Button, Checkbox } from "antd";

import Footer from "../../Partials/Footer/Footer.jsx";
import { IS_CONSOLE_LOG_OPEN } from "../../../utils/constants/constants.js";
import { googleClientId } from "../../../config/config.js";

import { fetchApi } from "../../../utils/api/fetch_api";
import {
  authenticateRequest,
  loginUserRequest,
  updateProfilePhotoRequest,
  postUsersRequest
} from "../../../utils/api/requests.js";

import "./style.scss";

const ForgotPasswordModal = Form.create({ name: "form_in_modal" })(
  class extends React.Component {
    render() {
      const { visible, onCancel, onCreate, form, verifyReCaptcha } = this.props;
      const { getFieldDecorator } = form;
      return (
        <div>
          <Modal
            visible={visible}
            centered
            title="Forgot Password"
            okText="Submit"
            onCancel={onCancel}
            onOk={onCreate}
          >
            <Form layout="vertical">
              <Form.Item label="Username or Email Address">
                {getFieldDecorator("username", {
                  rules: [
                    {
                      required: true,
                      message: "Please enter your username or email address!"
                    }
                  ]
                })(<Input />)}
              </Form.Item>
            </Form>
            <div>
              <ReCaptcha
                sitekey="6LfOH6IUAAAAAL4Ezv-g8eUzkkERCWlnnPq_SdkY"
                action="forgot_password"
                verifyCallback={verifyReCaptcha}
              />
            </div>
          </Modal>
        </div>
      );
    }
  }
);

class SignInPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: "",
      username: "",
      password: "",
      profilePhotoUrl: "",
      isUserLoggedIn: false,
      isUserAuthenticated: false,
      isAuthenticationChecking: false,
      isVerificationReSendDisplaying: false,
      showModal: false
    };

    this.handleSignIn = this.handleSignIn.bind(this);
    this.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
    this.generateSignInForm = this.generateSignInForm.bind(this);
    this.postUser = this.postUser.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.saveFormRef = this.saveFormRef.bind(this);
    this.verifyReCaptchaCallback = this.verifyReCaptchaCallback.bind(this);
    this.verifyForgotPasswordReCaptchaCallback = this.verifyForgotPasswordReCaptchaCallback.bind(
      this
    );
  }

  verifyReCaptchaCallback(recaptchaToken) {
    IS_CONSOLE_LOG_OPEN &&
      console.log("\n\nyour recaptcha token:", recaptchaToken, "\n");
    loginUserRequest.config.body.recaptcha_token = recaptchaToken;
  }

  verifyForgotPasswordReCaptchaCallback(recaptchaToken) {
    IS_CONSOLE_LOG_OPEN &&
      console.log("\n\nyour recaptcha token:", recaptchaToken, "\n");
    postUsersRequest.config.body = { recaptcha_token: recaptchaToken };
  }

  toggleModal() {
    this.setState({ showModal: !this.state.showModal });
  }

  handleCreate() {
    const form = this.formRef.props.form;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      console.log("Received values of form: ", values);
      postUsersRequest.config.body["username"] = values.username;
      postUsersRequest.config.body = JSON.stringify(
        postUsersRequest.config.body
      );
      fetchApi(
        postUsersRequest.url("forgot_password"),
        postUsersRequest.config
      ).then(response => {
        if (response.ok) {
          if (response.json.success === true) {
            this.toggleModal();
            this.props.alert(
              5000,
              "info",
              "A link to reset password has sent to your email!"
            );
          } else {
            this.props.alert(
              5000,
              "error",
              "Error: " + response.json.error_message
            );
          }
        } else {
          this.props.alert(5000, "error", "Something went wrong!");
        }
        postUsersRequest.config.body = {};
      });
      form.resetFields();
    });
  }

  saveFormRef(formRef) {
    this.formRef = formRef;
  }

  postUser(type) {
    if (type === "generate_activation_code") {
      postUsersRequest.config.body = JSON.stringify({
        username: this.state.username,
        password: this.state.password
      });
      fetchApi(postUsersRequest.url(type), postUsersRequest.config).then(
        response => {
          if (response.ok) {
            if (response.json.success === true) {
              this.setState({
                isVerificationReSendDisplaying: false,
                username: "",
                password: ""
              });
              this.props.alert(
                5000,
                "info",
                "New activation link has sent to your email!"
              );
            } else {
              this.props.alert(
                5000,
                "error",
                "Error: " + response.json.error_message
              );
            }
          } else {
            this.props.alert(5000, "error", "Something went wrong!");
          }
        }
      );
    }
  }

  handleSignIn(event) {
    IS_CONSOLE_LOG_OPEN && console.log("handle sign in first");
    event.preventDefault();
    loginUserRequest.config.body.username = event.target[0].value;
    loginUserRequest.config.body.password = event.target[1].value;
    IS_CONSOLE_LOG_OPEN &&
      console.log("handle sign in config body", loginUserRequest.config.body);
    loginUserRequest.config.body = JSON.stringify(loginUserRequest.config.body);
    fetchApi(loginUserRequest.url, loginUserRequest.config).then(response => {
      if (response.ok) {
        if (response.json.success === true) {
          this.token = `${
            response.json.data.token_type
          } ${response.json.data.access_token.trim()}`;
          IS_CONSOLE_LOG_OPEN && console.log(this.token);
          this.setState({
            token: this.token
          });
          this.props.passStatesFromSignin(
            this.token,
            true,
            response.json.data.profile_updated
          );
          this.setState({
            isUserLoggedIn: true,
            isAuthenticationChecking: false
          });
          this.props.setIsUserLoggedIn(true);
          this.props.setIsAuthenticationChecking(false);
        } else {
          if (response.json.error_code === 13) {
            this.setState({
              isVerificationReSendDisplaying: true,
              username: loginUserRequest.config.body.username,
              password: loginUserRequest.config.body.password
            });
          } else {
            console.log(response, response.json.error_message);
            this.props.alert(
              5000,
              "error",
              "Error: " + response.json.error_message
            );
          }
        }
      } else {
        this.props.alert(5000, "error", "Something went wrong!");
      }
    });
    loginUserRequest.config.body = JSON.parse(loginUserRequest.config.body);
  }

  handleGoogleSignIn() {
    window.gapi.load("client:auth2", () => {
      window.gapi.client
        .init({
          clientId: googleClientId,
          scope: "email https://www.googleapis.com/auth/gmail.readonly"
        })
        .then(() => {
          this.googleAuth = window.gapi.auth2.getAuthInstance();
          let authenticated = this.googleAuth.isSignedIn.get();
          this.setState(() => ({ isUserAuthenticated: authenticated }));
          this.googleAuth.isSignedIn.listen(
            this.props.setIsUserAuthenticated(this.googleAuth.isSignedIn.get())
          );
          this.googleAuth.signIn().then(response => {
            IS_CONSOLE_LOG_OPEN && console.log("signIn response", response);
            if (response.Zi.token_type === "Bearer") {
              IS_CONSOLE_LOG_OPEN &&
                console.log(
                  "google access_token:",
                  response.Zi.access_token,
                  response,
                  response.w3.Paa
                );
              let photoUrl = response.w3.Paa;
              const { url, config } = authenticateRequest;
              config.body.token = this.googleAuth.currentUser
                .get()
                .getAuthResponse().access_token;
              config.body = JSON.stringify(config.body);
              fetchApi(url, config).then(response => {
                if (response.ok) {
                  this.token = `${
                    response.json.data.token_type
                  } ${response.json.data.access_token.trim()}`;
                  this.postGoogleProfilePhoto(photoUrl, this.token);
                  IS_CONSOLE_LOG_OPEN &&
                    console.log(
                      this.token,
                      "profile updated?",
                      response.json.data.profile_updated
                    );
                  this.props.passStatesFromSignin(
                    this.token,
                    true,
                    response.json.data.profile_updated
                  );
                  this.setState({ token: this.token });
                  this.setState({ isUserLoggedIn: true });
                  this.props.setIsUserLoggedIn(this.state.isUserLoggedIn);
                }
              });
              this.setState({ isAuthenticationChecking: false });
              this.props.setIsAuthenticationChecking(
                this.state.isAuthenticationChecking
              );
              config.body = JSON.parse(config.body);
            }
          });
        });
    });
  }

  postGoogleProfilePhoto(photoURL, token) {
    updateProfilePhotoRequest.config.headers.Authorization = token;
    updateProfilePhotoRequest.config.body = JSON.stringify({
      photo_url: photoURL
    });
    console.log(updateProfilePhotoRequest);
    fetchApi(
      updateProfilePhotoRequest.url,
      updateProfilePhotoRequest.config
    ).then(response => {
      if (response.ok) {
        console.log(response);
      }
    });
  }

  generateTopButtons() {
    return (
      <div className="sign_in-top">
        <Link to="/">
          <img
            className="logo"
            src="src/assets/icons/JobHax-logo-white.svg"
            alt="JobHax-logo"
          />
        </Link>
        <Link to="/">
          <button>Home</button>
        </Link>
      </div>
    );
  }

  generateSignInForm() {
    const { getFieldDecorator } = this.props.form;
    const styleResendPassword = {
      fontSize: "90%",
      marginTop: -12,
      cursor: "pointer",
      textAlign: "end"
    };
    return (
      <Form onSubmit={this.handleSignIn} className="login-form">
        <Form.Item>
          {getFieldDecorator("username", {
            rules: [{ required: true, message: "Please enter your username!" }]
          })(
            <Input
              prefix={<Icon type="user" style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Username"
            />
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator("password", {
            rules: [{ required: true, message: "Please enter your Password!" }]
          })(
            <Input
              prefix={<Icon type="lock" style={{ color: "rgba(0,0,0,.25)" }} />}
              type="password"
              placeholder="Password"
            />
          )}
        </Form.Item>
        <Form.Item>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {getFieldDecorator("remember", {
              valuePropName: "checked",
              initialValue: true
            })(<Checkbox>Remember me</Checkbox>)}
            <a
              className="login-form-forgot"
              style={{ fontSize: "90%" }}
              onClick={this.toggleModal}
            >
              Forgot password
            </a>
            <ForgotPasswordModal
              wrappedComponentRef={this.saveFormRef}
              visible={this.state.showModal}
              onCancel={this.toggleModal}
              onCreate={this.handleCreate}
              verifyReCaptcha={this.verifyForgotPasswordReCaptchaCallback}
            />
          </div>
          {this.state.isVerificationReSendDisplaying && (
            <div
              style={styleResendPassword}
              onClick={() => this.postUser("generate_activation_code")}
            >
              <a> Resend activation email? </a>
            </div>
          )}
          <div>
            <ReCaptcha
              sitekey="6LfOH6IUAAAAAL4Ezv-g8eUzkkERCWlnnPq_SdkY"
              action="signin"
              verifyCallback={this.verifyReCaptchaCallback}
            />
          </div>
          <Button
            type="primary"
            htmlType="submit"
            className="login-form-button"
            style={{ width: "100%", borderRadius: 0 }}
          >
            Log in
          </Button>
          <div>
            Or{" "}
            <Link to="/signup" style={{ fontSize: "90%" }}>
              register now!
            </Link>
          </div>
          <div className="social-buttons-container">
            <div>
              <Link to="/dashboard">
                <button
                  className="social-buttons-google"
                  onClick={this.handleGoogleSignIn}
                >
                  <img src="../../../src/assets/icons/btn_google_signin_light_normal_web@2x.png" />
                </button>
              </Link>
            </div>
          </div>
        </Form.Item>
      </Form>
    );
  }

  generateSignIn() {
    return (
      <div className="sign_in-form-container">
        <div className="content-container">
          <h1>Sign in</h1>
          {this.generateSignInForm()}
        </div>
      </div>
    );
  }

  render() {
    IS_CONSOLE_LOG_OPEN && console.log("signIn page render run");
    return (
      <div>
        <div className="sign_in-background">{this.generateTopButtons()}</div>
        <div className="sign_in-vertical-container">
          <div className="sign_in-container">{this.generateSignIn()}</div>
        </div>
        <div className="bottom-fixed-footer">
          <Footer />
        </div>
      </div>
    );
  }
}

const SignIn = Form.create({ name: "signin" })(SignInPage);

export default SignIn;