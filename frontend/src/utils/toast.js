let toastListener = null;

export const registerToastListener = (listener) => {
  toastListener = listener;
};

export const toast = {
  success: (msg) => {
    if (toastListener) toastListener(msg, 'success');
    else console.log("Success Toast:", msg);
  },
  error: (msg) => {
    if (toastListener) toastListener(msg, 'error');
    else console.error("Error Toast:", msg);
  },
  warning: (msg) => {
    if (toastListener) toastListener(msg, 'warning');
    else console.warn("Warning Toast:", msg);
  },
  info: (msg) => {
    if (toastListener) toastListener(msg, 'info');
    else console.info("Info Toast:", msg);
  }
};
