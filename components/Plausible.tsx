"use client";

import { useEffect } from "react";

export const Plausible = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@plausible-analytics/tracker").then(({ init }) =>
        init({
          domain: "splitter.noah.zone",
          endpoint: "/hey",
          outboundLinks: true,
          formSubmissions: true,
        })
      );
    }
  }, []);

  return null;
};
