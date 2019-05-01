import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";

import ModalHeader from "./SubComponents/ModalHeader/ModalHeader.jsx";
import Notes from "./SubComponents/Notes.jsx";
import ReviewInput from "./SubComponents/ReviewInput/ReviewInput.jsx";
import CompanyStats from "../../Partials/CompanyStats/CompanyStats.jsx";
import Reviews from "../../Companies/Reviews/Reviews.jsx";
import { fetchApi } from "../../../utils/api/fetch_api";
import { getReviewsRequest } from "../../../utils/api/requests.js";
import {
  IS_CONSOLE_LOG_OPEN,
  makeTimeBeautiful
} from "../../../utils/constants/constants.js";

import "./style.scss";

class CardModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      imageLoadError: true,
      whatIsDisplaying: "company",
      isEnteringReview: false,
      isAlreadySubmittedReview: false,
      isReviewsDisplaying: false,
      isUpdated: false,
      company: {},
      reviewsList: []
    };

    this.toggleReviewEdit = this.toggleReviewEdit.bind(this);
    this.toggleReviewDisplay = this.toggleReviewDisplay.bind(this);
    this.setCompany = this.setCompany.bind(this);
  }

  componentDidMount() {
    let newReviewsUrl =
      getReviewsRequest.url +
      "?company_id=" +
      this.props.card.companyObject.id +
      "&position_id=" +
      this.props.card.position.id +
      "&all_reviews=true";
    getReviewsRequest.config.headers.Authorization = this.props.token;
    fetchApi(newReviewsUrl, getReviewsRequest.config).then(response => {
      if (response.ok) {
        this.setState({ reviewsList: response.json.data });
        IS_CONSOLE_LOG_OPEN &&
          console.log(
            "card modal position reviews response json data",
            response.json.data
          );
      }
    });
  }

  toggleReviewEdit() {
    this.setState({ isEnteringReview: !this.state.isEnteringReview });
  }

  toggleReviewDisplay() {
    this.setState({ isReviewsDisplaying: !this.state.isReviewsDisplaying });
  }

  setCompany(newCompany) {
    console.log("setCompany run!", this.props.card.companyObject, "\n after");
    this.props.card.companyObject = newCompany;
    console.log(this.props.card.companyObject, "setCompanyLog last");
    this.setState({ isUpdated: true });
  }

  generateNavigationPanel(itemList) {
    const styleNormal = { paddingTop: "50px" };
    const styleOnReviewEntry = { paddingTop: "594px", paddingBottom: "260px" };
    const notesSubHeaderStyle =
      this.state.isEnteringReview || this.state.isReviewsDisplaying
        ? styleOnReviewEntry
        : styleNormal;
    return itemList.map(item => (
      <div
        style={item == "Notes" ? notesSubHeaderStyle : { paddingTop: "0px" }}
        key={itemList.indexOf(item)}
        className="modal-body navigation subheaders"
      >
        {item}
      </div>
    ));
  }

  generateModalBodyInfo(itemsList) {
    return itemsList.map(item => (
      <div key={itemsList.indexOf(item)} className="modal-body main data info">
        {item}
      </div>
    ));
  }

  render() {
    const { toggleModal, card } = this.props;
    const reviewContainerMargin = this.state.isEnteringReview
      ? {
          marginBottom: "140px"
        }
      : { marginBottom: 0 };
    console.log(card, "---------", this.state.isUpdated);

    return ReactDOM.createPortal(
      <React.Fragment>
        <div className="modal" onClick={toggleModal}>
          <section
            className="modal-main"
            onClick={e => {
              e.stopPropagation();
            }}
          >
            <ModalHeader
              showOptions={this.state.showOptions}
              card={this.props.card}
              icon={this.props.icon}
              id={this.props.id}
              columnName={this.props.columnName}
              token={this.props.token}
              deleteJobFromList={this.props.deleteJobFromList}
              moveToRejected={this.props.moveToRejected}
              updateApplications={this.props.updateApplications}
            />

            <div className="modal-body">
              <div className="modal-body navigation">
                {this.generateNavigationPanel([
                  "Company",
                  "Position",
                  "Date",
                  "Source",
                  "Notes"
                ])}
              </div>
              <div className="modal-body main">
                <div className="modal-body main data">
                  <div>
                    {this.generateModalBodyInfo([
                      card.companyObject.company,
                      card.position.job_title,
                      makeTimeBeautiful(card.applyDate, "date"),
                      card.app_source === null ? "N/A" : card.app_source.value
                    ])}
                  </div>
                  <div className="company-stats-container">
                    <CompanyStats company={card.companyObject} />
                  </div>
                </div>
                <div className="review-container" style={reviewContainerMargin}>
                  {!this.state.isEnteringReview && (
                    <div className="review-entry-container">
                      {this.state.reviewsList.length > 0 && (
                        <div
                          className="review-button"
                          style={{ marginTop: "-28px" }}
                          onClick={this.toggleReviewDisplay}
                        >
                          {this.state.isReviewsDisplaying
                            ? "Close Reviews"
                            : "See Reviews"}
                        </div>
                      )}
                      {this.state.isReviewsDisplaying === true && (
                        <Reviews
                          reviewsList={this.state.reviewsList}
                          positionsList={[]}
                          company_id={this.props.card.companyObject.id}
                          token={this.props.token}
                          style={{
                            height: "auto",
                            width: "560px",
                            marginLeft: "12px",
                            margintTop: "12px",
                            paddingTop: 0,
                            minHeight: "540px",
                            maxHeight: "540px",
                            display: "block"
                          }}
                          reviewContainerStyle={{
                            display: "block",
                            marginBottom: 20
                          }}
                          leftWidth={{
                            minWidth: "220px",
                            maxWidth: "220px"
                          }}
                        />
                      )}
                    </div>
                  )}
                  <div className="review-entry-container">
                    {!this.state.isEnteringReview ? (
                      <div
                        className="review-button"
                        style={{ marginTop: "-28px" }}
                        onClick={this.toggleReviewEdit}
                      >
                        {this.state.isAlreadySubmittedReview
                          ? "Update Your Review"
                          : "Add a Review"}
                      </div>
                    ) : (
                      <div className="modal-reviews-container">
                        <ReviewInput
                          token={this.props.token}
                          toggleReview={this.toggleReviewEdit}
                          card={this.props.card}
                          setCompany={this.setCompany}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-body main notes">
                  <Notes card={this.props.card} token={this.props.token} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </React.Fragment>,
      document.querySelector("#modal")
    );
  }
}

export default CardModal;
