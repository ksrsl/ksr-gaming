// KSR Gaming - Second Life Media-on-a-Prim Controller v0.4.1
// Drop this script into the console's root prim and compile it in Mono.

string SITE_URL = "https://ksrsl.github.io/ksr-gaming/";
string SYNC_URL = "https://ksr-gaming-sync.ksr-hstn-ai-9ca1.workers.dev";

string SCREEN_LINK_NAME = "SCREEN";
string POWER_LINK_NAME = "POWER";
string HOME_LINK_NAME = "HOME";
integer SCREEN_FACE = 0;
integer OWNER_ONLY_POWER = FALSE;
integer AUTO_POWER_ON = TRUE;
integer AUTO_RESOLUTION = TRUE;
integer AUTO_DETECT_SCREEN_AXES = TRUE;
integer SCREEN_WIDTH_AXIS = 0;  // Manual fallback: 0 = X, 1 = Y, 2 = Z
integer SCREEN_HEIGHT_AXIS = 2; // Used only when AUTO_DETECT_SCREEN_AXES is FALSE
integer MAX_MEDIA_PIXELS = 1920;
integer MIN_MEDIA_PIXELS = 256;

integer gScreenLink = 0;
integer gPowerLink = 0;
integer gHomeLink = 0;
integer gPowered = FALSE;
string gRoomToken = "";
integer gMediaWidth = 1920;
integer gMediaHeight = 1080;

ensureRoomToken()
{
    if (gRoomToken == "")
    {
        gRoomToken = llSHA1String((string)llGenerateKey() + (string)llGetUnixTime() + (string)llGetOwner());
    }
}

float axisSize(vector size, integer axis)
{
    if (axis == 1) return size.y;
    if (axis == 2) return size.z;
    return size.x;
}

integer clampPixels(integer pixels)
{
    if (pixels < MIN_MEDIA_PIXELS) return MIN_MEDIA_PIXELS;
    if (pixels > MAX_MEDIA_PIXELS) return MAX_MEDIA_PIXELS;
    return pixels;
}

list adaptedResolution()
{
    if (!AUTO_RESOLUTION || !gScreenLink)
    {
        return [1920, 1080];
    }

    vector size = llList2Vector(llGetLinkPrimitiveParams(gScreenLink, [PRIM_SIZE]), 0);
    float physicalWidth;
    float physicalHeight;
    if (AUTO_DETECT_SCREEN_AXES)
    {
        // A flat display's two largest dimensions are its visible width and height.
        // The smallest dimension is depth and must never be used for media aspect ratio.
        list dimensions = llListSort([size.x, size.y, size.z], 1, FALSE);
        physicalWidth = llList2Float(dimensions, 0);
        physicalHeight = llList2Float(dimensions, 1);
    }
    else
    {
        physicalWidth = axisSize(size, SCREEN_WIDTH_AXIS);
        physicalHeight = axisSize(size, SCREEN_HEIGHT_AXIS);
    }
    if (physicalWidth <= 0.001 || physicalHeight <= 0.001)
    {
        return [1920, 1080];
    }

    float ratio = physicalWidth / physicalHeight;
    integer width;
    integer height;
    if (ratio >= 1.0)
    {
        width = MAX_MEDIA_PIXELS;
        height = clampPixels(llRound((float)MAX_MEDIA_PIXELS / ratio));
    }
    else
    {
        height = MAX_MEDIA_PIXELS;
        width = clampPixels(llRound((float)MAX_MEDIA_PIXELS * ratio));
    }
    return [width, height];
}

updateMediaResolution()
{
    if (!gScreenLink) return;
    list resolution = adaptedResolution();
    integer width = llList2Integer(resolution, 0);
    integer height = llList2Integer(resolution, 1);
    if (width == gMediaWidth && height == gMediaHeight) return;

    gMediaWidth = width;
    gMediaHeight = height;
    if (gPowered)
    {
        llSetLinkMedia(gScreenLink, SCREEN_FACE,
        [
            PRIM_MEDIA_WIDTH_PIXELS, gMediaWidth,
            PRIM_MEDIA_HEIGHT_PIXELS, gMediaHeight,
            PRIM_MEDIA_AUTO_SCALE, TRUE,
            PRIM_MEDIA_FIRST_CLICK_INTERACT, TRUE
        ]);
    }
}

integer findLink(string wanted)
{
    integer count = llGetNumberOfPrims();
    integer link = 1;
    for (; link <= count; ++link)
    {
        if (llToUpper(llStringTrim(llGetLinkName(link), STRING_TRIM)) == llToUpper(wanted))
        {
            return link;
        }
    }
    return 0;
}

string launchUrl(integer skipBoot)
{
    ensureRoomToken();
    string separator = "?";
    if (llSubStringIndex(SITE_URL, "?") != -1)
    {
        separator = "&";
    }

    return SITE_URL + separator
        + "sl=1&skipBoot=" + (string)skipBoot
        + "&session=" + (string)llGetUnixTime()
        + "&sync=" + llEscapeURL(SYNC_URL)
        + "&room=" + (string)llGetKey()
        + "&token=" + gRoomToken;
}

integer urlConfigured()
{
    return llSubStringIndex(SITE_URL, "REPLACE-WITH") == -1;
}

setScreenColor(vector color)
{
    if (gScreenLink)
    {
        llSetLinkPrimitiveParamsFast(gScreenLink, [PRIM_COLOR, SCREEN_FACE, color, 1.0]);
    }
}

powerOff()
{
    gPowered = FALSE;
    llSetTimerEvent(0.0);
    if (gScreenLink)
    {
        llClearLinkMedia(gScreenLink, SCREEN_FACE);
        setScreenColor(<0.003, 0.005, 0.008>);
    }
}

powerOn()
{
    if (!gScreenLink)
    {
        llOwnerSay("Setup needed: no linked prim named " + SCREEN_LINK_NAME + " was found.");
        return;
    }
    if (!urlConfigured())
    {
        llOwnerSay("Setup needed: replace SITE_URL at the top of this script with your hosted KSR Gaming URL.");
        return;
    }

    string url = launchUrl(FALSE);
    list resolution = adaptedResolution();
    gMediaWidth = llList2Integer(resolution, 0);
    gMediaHeight = llList2Integer(resolution, 1);
    setScreenColor(<1.0, 1.0, 1.0>);

    integer status = llSetLinkMedia(gScreenLink, SCREEN_FACE,
    [
        PRIM_MEDIA_ALT_IMAGE_ENABLE, TRUE,
        PRIM_MEDIA_CONTROLS, PRIM_MEDIA_CONTROLS_MINI,
        PRIM_MEDIA_CURRENT_URL, url,
        PRIM_MEDIA_HOME_URL, url,
        PRIM_MEDIA_AUTO_LOOP, FALSE,
        PRIM_MEDIA_AUTO_PLAY, TRUE,
        PRIM_MEDIA_AUTO_SCALE, TRUE,
        PRIM_MEDIA_AUTO_ZOOM, FALSE,
        PRIM_MEDIA_FIRST_CLICK_INTERACT, TRUE,
        PRIM_MEDIA_WIDTH_PIXELS, gMediaWidth,
        PRIM_MEDIA_HEIGHT_PIXELS, gMediaHeight,
        PRIM_MEDIA_WHITELIST_ENABLE, FALSE,
        PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE,
        PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_NONE
    ]);

    if (status == STATUS_OK)
    {
        gPowered = TRUE;
        llSetTimerEvent(2.0);
    }
    else
    {
        setScreenColor(<0.003, 0.005, 0.008>);
        llOwnerSay("The media face could not start. Check SCREEN_FACE and the parcel's media settings. Error " + (string)status + ".");
    }
}

goHome()
{
    if (!gPowered)
    {
        powerOn();
        return;
    }

    string url = launchUrl(TRUE);
    updateMediaResolution();
    llSetLinkMedia(gScreenLink, SCREEN_FACE,
    [
        PRIM_MEDIA_CURRENT_URL, url,
        PRIM_MEDIA_HOME_URL, url
    ]);
}

refreshLinks()
{
    gScreenLink = findLink(SCREEN_LINK_NAME);
    gPowerLink = findLink(POWER_LINK_NAME);
    gHomeLink = findLink(HOME_LINK_NAME);

    if (!gScreenLink)
    {
        llOwnerSay("No prim named " + SCREEN_LINK_NAME + " found. Rename the display prim or change SCREEN_LINK_NAME in the script.");
    }
}

default
{
    state_entry()
    {
        ensureRoomToken();
        refreshLinks();
        if (AUTO_POWER_ON)
        {
            powerOn();
        }
        else
        {
            powerOff();
        }
    }

    on_rez(integer startParameter)
    {
        llResetScript();
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
        else if (change & CHANGED_LINK)
        {
            refreshLinks();
            updateMediaResolution();
        }
        else if (change & CHANGED_SCALE)
        {
            updateMediaResolution();
        }
    }

    timer()
    {
        updateMediaResolution();
    }

    touch_start(integer totalNumber)
    {
        integer detected = 0;
        for (; detected < totalNumber; ++detected)
        {
            key toucher = llDetectedKey(detected);
            integer touchedLink = llDetectedLinkNumber(detected);

            if (touchedLink == gScreenLink && gScreenLink)
            {
                if (!gPowered)
                {
                    powerOn();
                }
                else
                {
                    updateMediaResolution();
                }
            }
            else if (touchedLink == gHomeLink && gHomeLink)
            {
                goHome();
            }
            else if (touchedLink == gPowerLink || (gPowerLink == 0 && touchedLink == LINK_ROOT))
            {
                if (OWNER_ONLY_POWER && toucher != llGetOwner())
                {
                    llRegionSayTo(toucher, 0, "Only the owner can control KSR Gaming power.");
                }
                else if (gPowered)
                {
                    powerOff();
                }
                else
                {
                    powerOn();
                }
            }
        }
    }
}
