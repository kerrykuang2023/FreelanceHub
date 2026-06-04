import { useEffect } from "react";

const usePageTitle = (title?: string) => {
  useEffect(() => {
    document.title = title ? `${title} | FreelanceHub` : "FreelanceHub";
  }, [title]);
};

export default usePageTitle;
