import { useEffect } from "react";

const SITE = "WORK OS";

export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    document.title = `${pageTitle} — ${SITE}`;
    return () => {
      document.title = SITE;
    };
  }, [pageTitle]);
}
