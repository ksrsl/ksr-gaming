// KSR Gaming - Second Life Media-on-a-Prim Controller v0.3
// Drop this script into the console's root prim and compile it in Mono.

string SITE_URL = "https://ksrsl.github.io/ksr-gaming/";
string SYNC_URL = "https://ksr-gaming-sync.ksr-hstn-ai-9ca1.workers.dev";

string SCREEN_LINK_NAME = "SCREEN";
string POWER_LINK_NAME = "POWER";
string HOME_LINK_NAME = "HOME";
integer SCREEN_FACE = 0;
integer OWNER_ONLY_POWER = FALSE;

integer gScreenLink = 0;
integer gPowerLink = 0;
integer gHomeLink = 0;
integer gPowered = FALSE;
string gRoomToken = "";

ensureRoomToken()
{
    if (gRoomToken == "")
    {
        gRoomToken = llSHA1String((string)llGenerateKey() + (string)llGetUnixTime() + (string)llGetOwner());
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
        PRIM_MEDIA_WIDTH_PIXELS, 2048,
        PRIM_MEDIA_HEIGHT_PIXELS, 1152,
        PRIM_MEDIA_WHITELIST_ENABLE, FALSE,
        PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE,
        PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_NONE
    ]);

    if (status == STATUS_OK)
    {
        gPowered = TRUE;
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
        powerOff();
    }

    on_rez(integer startParameter)
    {
        llResetScript();
    }

    changed(integer change)
    {
        if (change & (CHANGED_LINK | CHANGED_OWNER))
        {
            llResetScript();
        }
    }

    touch_start(integer totalNumber)
    {
        integer detected = 0;
        for (; detected < totalNumber; ++detected)
        {
            key toucher = llDetectedKey(detected);
            integer touchedLink = llDetectedLinkNumber(detected);

            if (touchedLink == gHomeLink && gHomeLink)
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
