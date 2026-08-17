// DeleteConfirmDialog.jsx  (or inline at the bottom of your file)
import {
  Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button, Box,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

export function DeleteConfirmDialog({ open, email, onCancel, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: { borderRadius: "12px", p: 1, maxWidth: 400 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: "50%",
            bgcolor: "rgba(253,237,237,1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <WarningAmberRoundedIcon sx={{ color: "rgba(193,70,70,1)", fontSize: 20 }} />
        </Box>
        <span style={{ fontFamily: "Rubik", fontWeight: 500, fontSize: "16px" }}>
          Remove team member?
        </span>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText sx={{ fontFamily: "Rubik", fontSize: "14px" }}>
          <strong style={{ color: "rgba(0,0,0,0.8)" }}>{email}</strong> will lose
          access to this organization immediately.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{ fontFamily: "Rubik", textTransform: "capitalize", borderRadius: "6px" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            fontFamily: "Rubik", textTransform: "capitalize", borderRadius: "6px",
            bgcolor: "rgba(193,70,70,1)",
            "&:hover": { bgcolor: "rgba(160,50,50,1)" },
          }}
        >
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
}