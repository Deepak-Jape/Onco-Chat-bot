import "@fortawesome/fontawesome-free/css/all.min.css";
import LogoIcon from "../../assets/LogoIcon.png";
import { Link } from "react-router-dom";
import profile from "../../assets/profilePicture/profilePic.jpg";
import { Avatar } from "@mui/material";
import { authService } from "../../auth/authService";
import { useDispatch, useSelector } from "react-redux";
import { clearAccountDetails } from "../../redux/accountSlice";
import { SideBarOptions } from "../../utils/helpers/helper";
import { baseURL } from "../../api/AxiosInstance.jsx";

const Sidebar = ({ collapsed, activeTab, onMenuChange }) => {
  let role = localStorage.getItem("userRole") || "";
  const userData = JSON.parse(localStorage.getItem("UserData") || "{}");
  const dispatch = useDispatch();
  const accountDetails = useSelector((state) => state.account.accountDetails);

  const resolveUserPhotoSrc = (value) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const filename = trimmed.split("/").filter(Boolean).pop();
    if (!filename) return "";

    const base = String(baseURL || "").replace(/\/+$/, "");
    if (!base) return `/user/setting/user/photo/${filename}`;
    return `${base}/user/setting/user/photo/${filename}`;
  };

  const handleLogout = async () => {
    authService.logout();
    dispatch(clearAccountDetails(null));
  };

  return (
    <div
      style={{
        // Use `fixed` instead of `sticky` to avoid Edge inconsistencies with
        // sticky inside flex/overflow containers.
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: 68,
        minWidth: 68,
        maxWidth: 68,
        flex: "0 0 68px",
        overflow: "hidden",
      }}
      className={`bg-sidePrime text-white z-20 flex flex-col justify-between transition-all duration-500`}
    >
      <div className="w-full px-2">
        <div className="p-3 transition-all duration-300">
          {!collapsed && (
            <div className="mt-3 text-left">
              <Link>
                <img src={LogoIcon} alt="LogoIcon" />
              </Link>
            </div>
          )}
        </div>

        <nav className="mt-2 flex flex-col gap-1.5">
          {SideBarOptions?.map((item, idx) => {
            return (
              <Link
                key={idx}
                to={item.link}
                onClick={() => !item?.disable && onMenuChange(item)}
                className={`flex items-center gap-3 px-2 mx-1.5 py-1.5 text-sm rounded-sm transition-all 
                  ${activeTab === item.tab
                    ? "bg-blue-500 text-white font-medium"
                    : "text-gray-200 hover:bg-blue-900 hover:text-white"
                  }`}
                style={{ color: item.link === "/admin/site_intelligence" ? "white" : "" }}
              >
                <img
                  src={item.icon}
                  alt="Icons"
                  className={`fa-${item.type || "solid"} text-base`}
                  style={{ width: "28px", height: "28px" }}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="text-white px-2 rounded-lg flex flex-col items-center m-2 mb-8">
        <div className="flex flex-col items-center">
          {/* {accountDetails?.user_photo ? (
            <img
              src={userData?.user_photo}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "200px",
                border: "1px solid #2F80ED",
              }}
              alt="Profile_img"
            />
          ) : (
            <Avatar
              sx={{
                width: "40px",
                height: "40px",
                borderRadius: "200px",
                border: "1px solid #2F80ED",
              }}
              alt="profile"
              src={userData?.user_photo ?? profile}
            />
          )} */}
          <Avatar
            src={resolveUserPhotoSrc(userData?.user_photo) || ""}
            alt="avatar"
            sx={{
              height: 40,
              width: 40,
            }}
          />
        </div>

        <div className="w-full border-t border-logoutHrLine my-3"></div>

        <button
          // onClick={() => instance.logoutPopup()}  logout
          onClick={() => handleLogout()}
          className="flex items-center gap-2 text-red-400 hover:text-red-500 text-sm font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
