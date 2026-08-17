import React, { useEffect, useRef, useState } from "react";
import CommonTabs from "../../common/Tabs";
import { settingtabs } from "../../utils/helpers/helper";
import SubscriptionsBilling from "./SubscriptionsBilling";
import AccountSkeleton from "./SettingsSkeleton/AccountSkeleton";
import OrganizationSkeleton from "./SettingsSkeleton/OrganizationSkeleton";
import UserManagementSkeleton from "./SettingsSkeleton/UserManagementSkeleton";
import SubscriptionsBillingSkeleton from "./SettingsSkeleton/SubscriptionsBillingSkeleton";
import * as API from "../../api/Profile";
import AccountTab from "./AccountTab";
import OrganizationTab from "./OrganizationTab";
import { headerStyles } from "../trialsHeader/trialsSubHeader/style";
import { useLocation } from "react-router-dom";
const FONT_RUBIK = "Rubik";
const USER_EMAIL = localStorage.getItem("userEmail") || "";

const styles = {
  page: { minHeight: "100vh", background: "#FFFFFF" },

  headerTitle: {
    fontFamily: FONT_RUBIK,
    fontSize: "27px",
    fontWeight: 500,
    lineHeight: "20px",
    color: "rgba(0,0,0,0.8)",
    textAlign: "left",
  },
};

/* ------------------------------ Main Component ---------------------------- */
export default function ProfileSetting() {
  const [activeTab, setActiveTab] = useState("Account");
  const [data, setData] = useState({});
  const [apiCall, setApiCall] = useState({});
  const [loading, setLoading] = useState({
    Account: true,
    Organization: true,
    "User Management": true,
    "Subscriptions & Billing": true,
  });
  const classes = headerStyles();
  const location = useLocation();
  const USER_ROLE = localStorage.getItem("userRole") || "";
  // const USER_ROLE = "Super Admin";
  const isOncoSuiteAdmin = USER_ROLE === "OncoSuits Admin";

  useEffect(() => {
    // 1. Prefer navigation state (return case)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      return;
    }
  }, [location.pathname, location.state]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     // Avoid re-fetching if we already have data
  //     if (data[activeTab]) return;

  //     try {
  //       if (activeTab === "Account") {
  //         const res = await API.getAccoutDetails(USER_EMAIL);
  //         localStorage.setItem("UserData", JSON.stringify(res));
  //         setData((prev) => ({ ...prev, account: res }));
  //       } else if (activeTab === "Organization") {
  //         if (isOncoSuiteAdmin) {
  //           ("");
  //         } else {
  //           const [res, audit, members, seats, invites] = await Promise.all([
  //             API.getOrganizationDetails(USER_EMAIL),
  //             API.getOrganizationAudit(data?.account?.organization_id),
  //             API.getTeamMemberDetails(USER_EMAIL),
  //             API.getOrganizationSeatsDetails(USER_EMAIL),
  //           ]);
  //           setData((prev) => ({
  //             ...prev,
  //             organization: res,
  //             auditLogs: audit?.auditLogs?.data,
  //             teamMembers: members,
  //             seats,
  //             invites,
  //           }));
  //         }
  //       } else if (activeTab === "User Management") {
  //         // const [members, seats, invites] = await Promise.all([
  //         //   API.getTeamMemberDetails(USER_EMAIL),
  //         //   API.getOrganizationSeatsDetails(USER_EMAIL),
  //         // ]);
  //         // setData((prev) => ({
  //         //   ...prev,
  //         //   teamMembers: members,
  //         //   seats,
  //         //   invites,
  //         // }));
  //       } else if (activeTab === "Subscriptions & Billing") {
  //         const [contract, payment, history] = await Promise.all([
  //           API.getCurrentContractDetails(USER_EMAIL),
  //           API.getPaymentInfoDetails(USER_EMAIL),
  //           API.getSubscriptionHistoryDetails(USER_EMAIL),
  //         ]);
  //         setData((prev) => ({
  //           ...prev,
  //           contract,
  //           paymentInfo: payment,
  //           history,
  //         }));
  //       }
  //     } catch (err) {
  //       console.error("Fetch failed", err);
  //     } finally {
  //       setLoading((prev) => ({ ...prev, [activeTab]: false }));
  //     }
  //   };

  //   fetchData();
  //   if (apiCall) {
  //     setApiCall(false);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [activeTab, apiCall]);

  const loadedTabsRef = useRef(new Set());

  const fetchAccount = async () => {
    const res = await API.getAccoutDetails(USER_EMAIL);
    localStorage.setItem("UserData", JSON.stringify(res));
    setData((prev) => ({ ...prev, account: res }));
  };

  const fetchOrganization = async () => {
    if (isOncoSuiteAdmin) return;

    // const [res, audit, members, seats] = await Promise.all([
    //   API.getOrganizationDetails(USER_EMAIL),
    //   API.getOrganizationAudit(data?.account?.organization_id),
    //   API.getTeamMemberDetails(USER_EMAIL),
    //   API.getOrganizationSeatsDetails(USER_EMAIL),
    // ]);
debugger
    const [audit, organization_data, seats] = await Promise.all([
      data.account.role_id > 2 ? null : API.getOrganizationAudit(data?.account?.organization_id),
      data.account.role_id > 2 ? API.getOrganizationDetails() : API.getSingleOrganization(data?.account?.organization_id),
      data.account.role_id > 2 ? null : API.getOrganizationSeatsDetails(USER_EMAIL),
    ]);

    setData((prev) => ({
      ...prev,
      organization: data.account.role_id > 2 ? organization_data : organization_data?.organization,
      auditLogs: audit?.data,
      teamMembers: organization_data?.users,
      seats,
    }));
    console.log("setData", data);
  };

  const fetchBilling = async () => {
    const [contract, payment, history] = await Promise.all([
      API.getCurrentContractDetails(USER_EMAIL),
      API.getPaymentInfoDetails(USER_EMAIL),
      API.getSubscriptionHistoryDetails(USER_EMAIL),
    ]);

    setData((prev) => ({
      ...prev,
      contract,
      paymentInfo: payment,
      history,
    }));
  };

  const tabFetchMap = {
    Account: fetchAccount,
    Organization: fetchOrganization,
    "Subscriptions & Billing": fetchBilling,
  };

  useEffect(() => {
    const loadTabData = async () => {
      // If already loaded and not forced, skip
      if (loadedTabsRef.current.has(activeTab) && !apiCall) return;

      try {
        setLoading((prev) => ({ ...prev, [activeTab]: true }));

        const fetchFn = tabFetchMap[activeTab];
        if (fetchFn) {
          await fetchFn();
          loadedTabsRef.current.add(activeTab); // mark as loaded
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading((prev) => ({ ...prev, [activeTab]: false }));
        if (apiCall) setApiCall(false);
      }
    };

    loadTabData();
  }, [activeTab, apiCall]);

  const tabContent = {
    Account: {
      component: (
        <AccountTab accountDetails={data.account} setApiCall={setApiCall} />
      ),
      skeleton: <AccountSkeleton />,
    },
    Organization: {
      component: (
        <OrganizationTab
          organizationDetails={data.organization}
          auditLogs={data.auditLogs}
          teamMemberList={data.teamMembers}
          organizationSeats={data.seats}
          setApicall={setApiCall}
          sentInvites={data.invites}
        />
      ),
      skeleton: isOncoSuiteAdmin ? "" : <OrganizationSkeleton />,
    },
    // "User Management": {
    //   component: (
    //     <UserManagement
    //       teamMemberList={data.teamMembers}
    //       organizationSeats={data.seats}
    //       setApicall={setApiCall}
    //       sentInvites={data.invites}
    //     />
    //   ),
    //   skeleton: <UserManagementSkeleton />,
    // },
    "Subscriptions & Billing": {
      component: (
        <SubscriptionsBilling
          paymentInfoDetails={data.paymentInfo}
          CurrentContractDetails={data.contract}
          subscriptionHistoryDetails={data.history}
          organizationSeats={data.seats}
        />
      ),
      skeleton: <SubscriptionsBillingSkeleton />,
    },
  };

  // Determine if the current active tab is loading
  const isLoading = loading[activeTab];
  const currentView = tabContent[activeTab];
  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{
        ...styles.page,
        overflow: "hidden",
        position: "fixed",
        width: "96vw"
      }}
    >
      {/* ==================== STICKY HEADER ==================== */}
      <div
        style={{
          borderBottom: "none",
          boxShadow: "none",
        }}
        className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200"
      >
        {/* Title */}
        <div className="w-full bg-white px-6 pt-5 pb-3">
          <h1 style={styles.headerTitle}>Settings</h1>
        </div>

        <div
          style={{
            background: "rgba(220,233,252,1)",
            padding: "0.5% 1% 0% 2%",
          }}
          className="w-full z-20"
        >
          <div style={{ padding: "0px" }} className={classes.header_tab}>
            {settingtabs?.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "active" : ""}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* ==================== END HEADER ==================== */}

      {/* ==================== CONTENT ==================== */}
      <main
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
        className="app-scroll"
      >
        {isLoading ? currentView.skeleton : currentView.component}
      </main>
    </div>
  );
}
