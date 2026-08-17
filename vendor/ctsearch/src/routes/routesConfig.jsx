import { lazy, useLayoutEffect } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../auth/authService";
// import BiotechLanding from "../pages/Solutions/Biotech/Biotechlanding";

const AboutUs = lazy(() => import("../AboutUs"));
const FirstScreen = lazy(() => import("../pages/FirstScreen/FirstScreen"));
const HomePage = lazy(() => import("../pages/MainPage"));
const PrivacyPolicy = lazy(() => import("../pages/privacy/PrivacyPolicy"));
const PatientIntelligence = lazy(() => import("../pages/Patient Intelligence/PatientIntelligence"));

const DrugIntelligence = lazy(() => import('../../src/pages/Solutions/Drug-Intelligence/DrugIntelligence'))
const SiteIntelligenceLanding = lazy(() =>
  import("../pages/siteIntelligence/SiteIntelligenceLanding"),
);
const AiAgentLanding = lazy(() => {
  return import("../pages/Ai Agent/AiAgentLanding");
});
const TrialIntelligenceLanding = lazy(() =>
  import("../pages/trialIntelligence/TrialIntelligenceLanding"),
);
const DrugIntelligenceLanding = lazy(() =>
  import("../pages/Drug intelligence/MainDrugIntelligencePage"),
);
const BiotechLanding = lazy(() =>
  import("../pages/Solutions/Biotech/Biotechlanding"),
);

const ClinicalDevelopmentLanding = lazy(() =>
  import("../pages/Solutions/ClinicalDevelopment/ClinicalDevelopmentLanding"),
);

const MedicalAffiarsLanding = lazy(() => import("../pages/Solutions/Medical-Affairs/MedicalAffairsLanding"),
)
const PortfolioManagementLanding = lazy(() =>
  import("../pages/Solutions/Portfolio/PortfolioManagementLanding"),

)

const ClinicalOperationsLanding = lazy(() => 
  import("../pages/Solutions/Clinical-Operations/ClinicalOperationsLanding")
);

const PharmaLanding = lazy(() => 
  import("../pages/Solutions/Pharma/PharmaLanding")
);

const CroLanding = lazy(() => 
  import("../pages/Solutions/Cro/CroLanding")
);

const ForgotPasswordPage = lazy(
  () => import("../pages/Forgotpswd/ForgotPasswordPage"),
);
const OtpVerifyPage = lazy(() => import("../pages/Forgotpswd/OtpVerifyPage"));
const SetNewPasswordPage = lazy(
  () => import("../pages/Forgotpswd/SetNewPasswordPage"),
);
const PasswordResetSuccessPage = lazy(
  () => import("../pages/Forgotpswd/PasswordResetSuccessPage"),
);
const SettingPage = lazy(() => import("../pages/SettingPage"));
const SiteDashboard = lazy(() => import("../pages/Site intelligence/SiteDashboard"))
const ScheduleDemo = lazy(() => import("../pages/ScheduleDemo/ScheduleDemo"));
const AdminLogin = lazy(() => import("../Admin/Login/login"));
const AdminOrganizationSettings = lazy(
  () => import("../Admin/Setting/AdminOrganizationSettings"),
);
const Addneworg = lazy(() => import("../Admin/Setting/Addneworg"));
const AddOrganizatioForm = lazy(
  () => import("../Admin/Setting/AddOrganizationForm"),
);
const RegulatoryDrugDetail = lazy(
  () => import("../pages/Regulatory/RegulatoryDrugDetail"),
);
const BookDemo = lazy(() => import("../pages/ScheduleDemo/BookDemo"));
const SiteIntelligenceDetails = lazy(
  () => import("../pages/Site intelligence/SiteIntelligenceDetails"),
);

const LoginRedirect = () => {
  useLayoutEffect(() => {
    authService.login();
  }, []);

  return null;
};

export const PUBLIC_ROUTES = [
  {
    path: "/",
    element: <FirstScreen />,
    meta: {
      title: "OncoSuite | Precision Oncology Intelligence Platform",
      titleTemplate: false,
      description:
        "OncoSuite precision oncology intelligence platform helps teams benchmark trials, improve feasibility, and make faster development decisions.",
    },
  },
  {
    path: "/site-intelligence",
    element: <SiteIntelligenceLanding />,
    meta: {
      title: "OncoSuite | Site Intelligence Platform",
      titleTemplate: false,
      description:
        "OncoSuite site intelligence platform helps you find, score, and compare research sites for faster study planning.",
    },
  },
  {
    path: "/trial-intelligence",
    element: <TrialIntelligenceLanding />,
    meta: {
      title: "OncoSuite | Trial Intelligence Platform",
      titleTemplate: false,
      description:
        "OncoSuite trial intelligence platform helps you evaluate trial design, evidence, and competitive context with confidence.",
    },
  },
   {
    path: "/drug-intelligence",
    element: <DrugIntelligence />,
    meta: {
      title: "OncoSuite | Drug Intelligence Platform",
      titleTemplate: false,
      description:
        "OncoSuite drug intelligence platform helps you evaluate drug development opportunities and competitive landscape with confidence.",
    },
  },
  {
    path: "/clinical-development",
    element: <ClinicalDevelopmentLanding />,
    meta: {
      title: "OncoSuite | Clinical Development Platform",
      titleTemplate: false,
      description:
        "OncoSuite clinical development platform supports evidence-led oncology decisions with benchmarking and strategy tools.",
    },
  },
  {
    path: "/medical-affairs",
    element: <MedicalAffiarsLanding />
    ,
    meta: {
      title: "OncoSuite | Medical Affairs Platform",
      titleTemplate: false,
      description:
        "OncoSuite medical affairs platform turns oncology evidence into clearer scientific and competitive strategy.",
    },
  },
  {
    path: "/portfolio-management",
    element: <PortfolioManagementLanding />,
    meta: {
      title: "OncoSuite | Portfolio Management Platform",
      titleTemplate: false,
      description:
        "OncoSuite portfolio management platform helps prioritize assets, assess value, and compare oncology programs.",
    },
  },
  {
    path: "/clinical-operations",
    element: <ClinicalOperationsLanding />,
    meta: {
      title: "OncoSuite | Clinical Operations Platform",
      titleTemplate: false,
      description:
        "OncoSuite clinical operations platform improves site selection, enrollment planning, and operational execution.",
    },
  },
  {
    path: "/biotech",
    element: <BiotechLanding />,
    meta: {
      title: "OncoSuite | Biotech Platform",
      titleTemplate: false,
      description:
        "OncoSuite biotech platform helps teams make sharper oncology development decisions with pipeline insight.",
    },
  },
  {
    path: "/ai-agents",
    element: <AiAgentLanding />,
    meta: {
      title: "OncoSuite | AI Agent Platform",
      titleTemplate: false,
      description:
      "Enterprise Oncology AI Agent for pharma, biotech, and CROs. Accelerate clinical trial intelligence, drug intelligence, competitive intelligence, and evidence-backed decisions."
    },
  },
  {
    path: "/pharma",
    element: <PharmaLanding />
    ,
    meta: {
      title: "OncoSuite | Pharma Platform",
      titleTemplate: false,
      description:
        "OncoSuite pharma platform delivers structured oncology intelligence for pipeline review and trial planning.",
    },
  },  
  {
    path: "/cro",
    element: <CroLanding />
    ,
    meta: {
      title: "OncoSuite | CRO Platform",
      titleTemplate: false,
      description:
        "OncoSuite CRO platform supports oncology feasibility, site selection, and faster study activation.",
    },
  },
  {
    path: "/schedule",
    element: <ScheduleDemo />,
    meta: {
      title: "OncoSuite | Schedule a Demo",
      titleTemplate: false,
      description:
        "Book a demo to see how OncoSuite supports oncology teams with trial intelligence and decision support.",
    },
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />,
    meta: {
      title: "OncoSuite | Privacy Policy",
      titleTemplate: false,
      description: "Read the OncoSuite privacy policy and how we handle your information.",
    },
  },
  {
    path: "/patient-intelligence",
    element: <PatientIntelligence />,
    meta: {
      title: "OncoSuite | Patient Intelligence Platform",
      titleTemplate: false,
      description:
        "OncoSuite patient intelligence platform helps oncology teams understand populations and trial fit.",
    },
  },
  {
    path: "/about",
    element: <AboutUs />,
    meta: {
      title: "OncoSuite | About Us",
      titleTemplate: false,
      description:
        "Learn about OncoSuite and our mission to bring precision oncology intelligence to life sciences teams.",
    },
  },
  {
    path: "/login",
    element: <LoginRedirect />,
    meta: {
      title: "OncoSuite | Login",
      titleTemplate: false,
      description: "Sign in to access your OncoSuite workspace.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
    meta: {
      title: "OncoSuite | Forgot Password",
      titleTemplate: false,
      description: "Reset your OncoSuite password securely.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/otp-verify",
    element: <OtpVerifyPage />,
    meta: {
      title: "OncoSuite | Verify OTP",
      titleTemplate: false,
      description: "Verify your one-time password to continue account recovery.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/set-new-password",
    element: <SetNewPasswordPage />,
    meta: {
      title: "OncoSuite | Set New Password",
      titleTemplate: false,
      description: "Create a new password for your OncoSuite account.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/password-reset-success",
    element: <PasswordResetSuccessPage />,
    meta: {
      title: "OncoSuite | Password Reset Success",
      titleTemplate: false,
      description: "Your OncoSuite password has been updated successfully.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/book-demo",
    element: <BookDemo />,
    meta: {
      title: "OncoSuite | Book a Demo",
      titleTemplate: false,
      description:
        "Book a demo with the OncoSuite team and see the platform in action.",
    },
  },

  // {
  //   path: "/profile-settings",
  //   element: <SettingPage />,
  // },
  // {
  //   path: "/admin/login",
  //   element: <AdminLogin />,
  // },

  // {
  //   path: "/admin/organization/:orgName",
  //   element: <AdminOrganizationSettings />,
  // },
  // {
  //   path: "/addnew",
  //   element: <Addneworg />,
  // },
  // {
  //   path: "/admin/users",
  //   element: <SettingsUserManagement />,
  // },
];

export const PROTECTED_ROUTES = [
  // {
  //   path: "/home",
  //   element: <HomePage />,
  // },
  {
    path: "/home",
    element: <Navigate to="/trials" replace />,
    meta: {
      title: "OncoSuite | Trials",
      titleTemplate: false,
      description: "OncoSuite trials workspace.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/trials",
    element: <HomePage />,
    meta: {
      title: "OncoSuite | Trials",
      titleTemplate: false,
      description:
        "Review oncology trial intelligence, benchmark evidence, and compare study-level signals.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/trials/:oncosuite_id",
    element: <HomePage />,
    meta: {
      title: "OncoSuite | Trials",
      titleTemplate: false,
      description:
        "Review oncology trial intelligence, benchmark evidence, and compare study-level signals.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/trials/treatment",
    element: <HomePage />,
    meta: {
      title: "OncoSuite | Treatment Analysis",
      titleTemplate: false,
      description: "Explore treatment-level trial intelligence and competitive context.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/trials/population",
    element: <HomePage />,
    meta: {
      title: "OncoSuite | Population Analysis",
      titleTemplate: false,
      description: "Review population-level trial intelligence and eligibility context.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/trials/feasibility",
    element: <HomePage />,
    meta: {
      title: "OncoSuite | Feasibility Analysis",
      titleTemplate: false,
      description: "Assess feasibility, site fit, and enrollment signals for trial planning.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/trials/:nct_id",
    element: <HomePage />,
    meta: {
      title: "OncoSuite | Trial Details",
      titleTemplate: false,
      description: "View detailed oncology trial intelligence for a specific study.",
      robots: "noindex,nofollow",
    },
  },

  {
    path: "/settings",
    element: <SettingPage />,
    meta: {
      title: "OncoSuite | Settings",
      titleTemplate: false,
      description: "Manage your OncoSuite account settings.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
    meta: {
      title: "OncoSuite | Admin Login",
      titleTemplate: false,
      description: "Sign in to the OncoSuite admin area.",
      robots: "noindex,nofollow",
    },
  },

  {
    path: "/settings/admin/organization/:orgName",
    element: <AdminOrganizationSettings />,
    meta: {
      title: "OncoSuite | Organization Settings",
      titleTemplate: false,
      description: "Manage organization-level settings in OncoSuite.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/settings/add-new-organization",
    element: <Addneworg />,
    meta: {
      title: "OncoSuite | Add Organization",
      titleTemplate: false,
      description: "Create a new organization in OncoSuite.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/admin/site_intelligence",
    element: <SiteDashboard />,
    meta: {
      title: "OncoSuite | Site Intelligence Admin",
      titleTemplate: false,
      description: "Review site intelligence details in the admin workspace.",
      robots: "noindex,nofollow",
    },
  },  
  {
    path: "/admin/site_intelligence_details",
    element: <SiteIntelligenceDetails />,
    meta: {
      title: "OncoSuite | Site Intelligence Admin",
      titleTemplate: false,
      description: "Review site intelligence details in the admin workspace.",
      robots: "noindex,nofollow",
    },
  },
   {
    path: "/admin/drug_intelligence",
    element: <DrugIntelligenceLanding />,
    meta: {
      title: "OncoSuite | Drug Intelligence Platform",
      titleTemplate: false,
      description:
        "OncoSuite drug intelligence platform helps you evaluate drug development opportunities and competitive landscape with confidence.",
    },
  },
  {
    path: "/admin/add_organization",
    element: <AddOrganizatioForm />,
    meta: {
      title: "OncoSuite | Add Organization",
      titleTemplate: false,
      description: "Add a new organization in the admin area.",
      robots: "noindex,nofollow",
    },
  },
  {
    path: "/regulatory",
    element: <RegulatoryDrugDetail />,
    meta: {
      title: "OncoSuite | Regulatory Intelligence",
      titleTemplate: false,
      description: "Review regulatory and drug-detail intelligence for oncology programs.",
      robots: "noindex,nofollow",
    },
  },
];
