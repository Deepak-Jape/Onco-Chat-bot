import { makeStyles } from "@mui/styles";

export const accountStyles = makeStyles(() => ({
    account_label_edit: {
        fontSize: "12px",
        fontWeight: "400",
        fontFamily: "Rubik",
        color: "rgba(0, 0, 0, 0.6)"
    },
    account_label: {
        fontSize: "14px",
        fontWeight: "500",
        fontFamily: "Rubik",
        color: "rgba(0, 0, 0, 0.6)",
        float: "left"
    },
    name_field: {
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        width: "100%",
        outline: "none",

        "&:focus": {
            outline: "none",
            border: "1px solid #60545c",
        },
    },

}))


export const inviteCard = {
    width: { xs: "100%", lg: "100%" },
    minHeight: 141,
    p: 2.5,
    borderRadius: 2,
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};
export const inviteCard_management = {
    width: { xs: "100%", lg: "100%" },
    minHeight: 141,
    p: "20px 20px 0px 20px",
    borderRadius: 2,
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};
export const seatsCard = {
    width: { xs: "100%", lg: 584 },
    minHeight: 141,
    p: "16px",
    borderRadius: "8px",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0px 4px 10px rgba(130,143,169,0.1)",
};
export const seatsFooterText = {
    fontFamily: "Rubik",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "100%",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.6)",
    textAlign: "left",
};

export const seatsFooterLink = {
    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "13px",
    lineHeight: "100%",
    letterSpacing: "0%",
    color: "rgba(38,102,190,1)",
};
export const seatsCount = {
    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.8)",
};
export const emailInput = {
    height: "44px",
    borderRadius: "6px",
    paddingLeft: "10px",
    paddingRight: "10px",

    fontFamily: "Rubik",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "20px",
    color: "rgba(0,0,0,0.6)",

    backgroundColor: "rgba(255,255,255,0.3)",

    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(0,0,0,0.2)",
    },

    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(0,0,0,0.2)",
    },

    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(38,102,190,1)",
        borderWidth: "1px",
    },

    "& input::placeholder": {
        color: "rgba(0,0,0,0.6)",
        opacity: 1,
    },
};
export const title = {
    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "21px",
    lineHeight: "24px",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.8)",
    textAlign: "left",
};
export const sectionTitle = {
    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "21px",
    lineHeight: "24px",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.8)",
    textAlign: "left",
};
export const subtitle = {
    fontFamily: "Rubik",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.6)",
    mt: 0.5,
    textAlign: "left",
};

export const seatsLabel = {
    fontFamily: "Rubik",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "16px",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.6)",
};

export const inviteBtn = {
    height: "44px",
    minHeight: "32px",
    whiteSpace: "nowrap",
    px: "30px",
    borderRadius: "6px",
    gap: "8px",

    bgcolor: "rgba(38,102,190,1)",
    color: "rgba(240,246,254,1)",

    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "100%",
    letterSpacing: "0%",

    textTransform: "none",
    boxShadow: "none",

    "&:hover": {
        bgcolor: "rgba(38,102,190,1)",
        boxShadow: "none",
    },

    "& .MuiButton-startIcon": {
        marginRight: "8px",
    },

    "& .MuiSvgIcon-root": {
        fontSize: "18px",
        color: "rgba(240,246,254,1)",
    },
};

export const progress = {
    height: "12px",
    borderRadius: "20px",
    backgroundColor: "#E8E8EC",
    my: 1.5,

    "& .MuiLinearProgress-bar": {
        backgroundColor: "rgba(47,128,237,1)",
        borderRadius: "20px",
    },
};
export const tableHeader = {
    bgcolor: "#F0F0F3",
    px: 2,
    py: 1.5,
};

export const headerText = {
    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "-0.01em",
    color: "rgba(0, 0, 0, 0.5)",
    textAlign: "left",
};
export const tableGrid = {
    display: "grid",
    gridTemplateColumns: `
    2fr
    3fr
    2fr
    1.5fr
    1.5fr
    0.7fr
  `,
    alignItems: "center",
    columnGap: "16px",
    width: "100%",
    minWidth: "900px",
    textAlign: "left",
};

export const row = {
    px: 2,
    py: 2,
    alignItems: "center",
};
export const seatsTitle = {
    fontFamily: "Rubik",
    fontWeight: 500,
    fontSize: "21px",
    lineHeight: "24px",
    letterSpacing: "0%",
    color: "rgba(0,0,0,0.8)",
    textAlign: "left",
};
export const adminCloseIcon = {
    width: "18px",
    height: "18px",
    color: "rgba(217,217,224,1)",
    textAlign: "left",
};

export const memberCloseIcon = {
    width: "18px",
    height: "18px",
    color: "#C14646",
    textAlign: "left",
};

export const rowName = { fontSize: 14, fontWeight: 500, fontFamily: "Rubik" };
export const rowMuted = {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    fontFamily: "Rubik",
};
