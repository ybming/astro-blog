import { SITE } from "@/config";
import type { ContentEntry } from "./contentEntry";
import { getEntryDate } from "./contentEntry";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const postFilter = (entry: ContentEntry) => {
  if (entry.data.draft) return false;

  const { data } = entry;
  const postTimezone = "timezone" in data ? data.timezone : undefined;
  const postDatetime = dayjs(getEntryDate(entry)).tz(postTimezone || SITE.timezone);

  const isPublishTimePassed =
    dayjs().tz(SITE.timezone).valueOf() >
    postDatetime.valueOf() - SITE.scheduledPostMargin;
  return import.meta.env.DEV || isPublishTimePassed;
};

export default postFilter;
