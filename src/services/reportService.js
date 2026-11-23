const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken");

const request = async (endpoint) => {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

export const reportService = {
  getMyReport: (period = "MONTH") =>
    request(
      `/reports/mine?period=${encodeURIComponent(period)}`
    ),

  getOverallReport: (period = "MONTH") =>
    request(
      `/reports/overall?period=${encodeURIComponent(period)}`
    ),

  getTelecallerReports: (period = "MONTH") =>
    request(
      `/reports/telecallers?period=${encodeURIComponent(period)}`
    ),

  getTelecallerReport: (username, period = "MONTH") =>
    request(
      `/reports/telecallers/${encodeURIComponent(
        username
      )}?period=${encodeURIComponent(period)}`
    ),
};