# Chrome Web Store Listing & Privacy Specification

**Extension Name**: StudEZE  
**Version**: 0.1.0  
**Manifest Version**: 3  
**Category**: Productivity / Education  

---

## 1. Description

### Summary (132 characters max)
Focus sessions, local file conversion, quick study notes, and an expiring scratchpad right in your browser side panel.

### Detailed Description
StudEZE is a lightweight, 100% private study and productivity companion designed for students and focused knowledge workers. It operates entirely on your device with zero AI models, zero cloud inference, and zero telemetry.

### Included Side Deck Utilities:
1. **Quick File Converter**:
   - Convert images locally: PNG, JPEG, WebP, BMP, GIF, SVG with compression quality controls.
   - Convert documents locally: Markdown to semantic HTML / plain text, HTML to Markdown / text, CSV to formatted JSON / HTML tables, JSON to CSV.
   - 100% local in-browser processing via HTML Canvas & text transformers. No files are ever uploaded to any server.

2. **Quick Notes**:
   - Fast, persistent notepad for capturing thoughts, definitions, equations, and bookmarks while reading or studying.
   - Automatic debounced autosave with instant status indicator.
   - Instant search across note titles and content.
   - Pin important notes to the top.
   - Sort by most recent, title, or date created.
   - One-click copy and clean text / markdown file export.
   - Stored locally in `chrome.storage.local`.

3. **Rough Copy**:
   - Minimalist, distraction-free temporary scratchpad for holding transient thoughts, links, pasted snippets, and calculations.
   - Built-in expiration timer: 1 hour, 24 hours, or 7 days with live countdown.
   - Automatically cleans up and wipes expired records upon timeout.
   - One-click copy, quick paste, and clear action with accidental deletion safeguard.

---

## 2. Permissions Justification

| Permission | Technical Requirement | Plain-English Reason |
| :--- | :--- | :--- |
| `sidePanel` | `chrome.sidePanel` | Allows StudEZE to open the compact utility Side Deck alongside web content without interfering with page layout. |
| `storage` | `chrome.storage.local` | Saves your Quick Notes and temporary Rough Copy text locally on your machine. |
| `alarms` | `chrome.alarms` | Periodically triggers background cleanup to automatically delete expired Rough Copy content according to your chosen timer. |
| `notifications` | `chrome.notifications` | Notifies you when timed conversions complete or when reminder alerts fire. |

*Note: No broad host permissions, `<all_urls>`, tab interception, or identity permissions are requested for these utilities.*

---

## 3. Privacy & Data Use Disclosures

- **Remote Processing**: None. StudEZE performs all conversions and text operations entirely on your local machine.
- **AI / LLMs**: StudEZE contains NO artificial intelligence, machine learning models, external LLM endpoints, or cloud inference.
- **User Data Collected**: Zero. No telemetry, no note tracking, no browsing history logging, and no analytics.
- **Retention**: Quick Notes persist on your local device until deleted by you. Rough Copy persists locally only until the selected expiration window (1h, 24h, 7d), after which it is permanently purged.
