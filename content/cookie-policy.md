---
title: Cookie Policy
description: Cookie policy for Chiron documentation template
---

# Cookie Policy

**Last Updated**: October 2025

## Introduction

This Cookie Policy explains how Chiron uses cookies and similar technologies. It's important to note that Chiron is a **static site generator** and, by default, does not use cookies.

## What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They allow the site to remember your preferences and improve your experience.

## Chiron Default Behavior

By default, Chiron-generated sites:

- **Do NOT use cookies** unless you explicitly enable them
- **Do NOT track users** or collect personal information
- **Are privacy-friendly** and require no user data

## Cookies Used in Chiron

### Essential Cookies

Chiron may optionally use one essential cookie for the theme preference feature:

| Cookie Name | Purpose | Duration | Type |
|-------------|---------|----------|------|
| `theme` | Stores user's theme preference (dark/light mode) | 1 year | Essential |

**Note**: This cookie is only created if you enable the `dark_mode` feature in your configuration.

### How Theme Cookie Works

1. **User Preference**: When you toggle between dark and light mode, your preference is saved
2. **Local Storage**: The preference is stored locally in your browser
3. **Automatic Loading**: On your next visit, your preferred theme loads automatically
4. **User Control**: You can change or delete this preference anytime

## Third-Party Cookies

If you integrate third-party services in your Chiron site, they may set their own cookies:

### Google Analytics (Optional)

If you enable Google Analytics in your configuration:

- **Purpose**: Tracks page views and user interactions
- **Privacy**: Subject to Google's Privacy Policy
- **Opt-out**: Users can opt-out via browser settings
- **Cookies**: Set by Google, not Chiron

### Google Tag Manager (Optional)

If you enable Google Tag Manager:

- **Purpose**: Manages multiple tracking scripts
- **Privacy**: Subject to Google's Privacy Policy
- **Cookies**: Set by services you configure in GTM

## Cookie Consent

Chiron includes an optional cookie consent banner feature. When enabled:

### Banner Features

- **Clear Information**: Explains what cookies are used
- **User Choice**: Accept or decline cookies
- **Policy Link**: Links to this cookie policy
- **Persistent Preference**: Remembers your choice

### Managing Cookies

You can manage cookies in several ways:

#### Browser Settings

Most browsers allow you to:
- View and delete cookies
- Block all cookies
- Allow specific cookies
- Set preferences for third-party cookies

**Instructions by browser:**
- [Chrome](https://support.google.com/chrome/answer/95647)
- [Firefox](https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer)
- [Safari](https://support.apple.com/en-us/HT201265)
- [Edge](https://support.microsoft.com/en-us/help/4027947)

#### Cookie Consent Banner

If the banner is enabled on the site:
1. Click **"Manage Preferences"** to see cookie options
2. Accept or decline different categories
3. Save your preferences

#### Site Settings

1. Change theme via the toggle button
2. This updates the theme cookie automatically

## Disabling Cookies

### For Users

You can disable cookies completely:

1. **Browser Settings**: Disable cookies in your browser preferences
2. **Individual Site**: Use browser extension to block cookies for specific sites
3. **Private Mode**: Browse in incognito/private mode (cookies cleared on exit)

**Note**: Some features may not work without cookies (e.g., theme preference).

### For Site Owners

To disable all cookies in your Chiron site:

```yaml
# chiron.config.yaml

features:
  dark_mode: false  # Disables theme cookie
  cookie_consent: false  # Disables consent banner
```

## GDPR Compliance

If you're serving EU users:

### Requirements

1. **Inform Users**: This cookie policy fulfills the information requirement
2. **Obtain Consent**: Cookie consent banner (optional but recommended)
3. **Provide Control**: Users can accept or decline non-essential cookies
4. **Allow Withdrawal**: Users can change preferences anytime

### Recommended Setup

For GDPR compliance, enable the cookie consent banner:

```yaml
# chiron.config.yaml

features:
  cookie_consent: true

cookies:
  banner_text: "We use cookies to enhance your browsing experience..."
  policy_label: Cookie Policy
  accept_label: Accept All
  decline_label: Decline
```

## CCPA Compliance

California residents have rights under CCPA:

- **Right to Know**: This policy informs you about cookies used
- **Right to Delete**: You can delete cookies via browser settings
- **Right to Opt-Out**: Cookie banner provides opt-out option

## Changes to This Policy

We may update this Cookie Policy from time to time. Changes will be posted here with an updated "Last Updated" date.

## Cookie Categories

### Essential Cookies

- **Purpose**: Required for basic site functionality
- **Examples**: Theme preference
- **Can I Disable?**: Yes, but some features may not work

### Performance Cookies

- **Purpose**: Analyze how visitors use the site
- **Examples**: Google Analytics
- **Can I Disable?**: Yes, via cookie consent or browser settings

### Functional Cookies

- **Purpose**: Remember your preferences
- **Examples**: Language, region
- **Can I Disable?**: Yes, via browser settings

**Note**: Chiron itself only uses essential cookies. Performance and functional cookies come from optional third-party integrations.

## Security

Cookies used by Chiron:

- **Secure**: Sent only over HTTPS
- **HttpOnly**: Not accessible via JavaScript (when applicable)
- **SameSite**: Protects against CSRF attacks
- **Minimal Data**: Only essential preferences, no personal information

## Contact

For questions about cookies:

- **GitHub Issues**: [github.com/agilira/chiron/issues](https://github.com/agilira/chiron/issues)
- **Email**: Contact via GitHub

## No Tracking

Chiron does not:

- Track you across websites
- Share data with advertisers
- Create profiles based on behavior
- Sell any information

The optional analytics you may add are separate and subject to their own privacy policies.

## Summary

| Question | Answer |
|----------|--------|
| **Does Chiron use cookies?** | Only optionally for theme preference |
| **Is tracking enabled?** | No, unless you add it yourself |
| **Can I disable cookies?** | Yes, in browser settings or config |
| **Are cookies required?** | No, all features work without cookies |
| **Is data collected?** | No personal data is collected |
| **Are cookies secure?** | Yes, essential cookies are secure |

---

**Note**: This is a template cookie policy. Customize it based on your specific use case and consult with legal counsel for compliance with applicable laws in your jurisdiction.

