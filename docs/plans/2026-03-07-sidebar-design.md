# Collapsible Sidebar Design - 2026-03-07

## Overview

Improve the collapsed state of the Admin Web sidebar to be more minimalistic, with larger icons and refined spacing, as requested by the user.

## Design Decisions

### 1. Iconography

- **Size:** Increase base icon size from `20px` to `24px` in collapsed mode to improve visibility and click target size.
- **Stroke Width:** Reduce `strokeWidth` to `1.5px` (from default `2px`) for a cleaner, more elegant aesthetic.
- **Active State:** Maintain `2.5px` or slightly bolder stroke for active items to provide clear feedback.

### 2. Layout & Spacing

- **Collapsed Width:** Keep `w-20` (80px) for the collapsed sidebar.
- **Vertical Spacing:** Increase padding between nav items to `py-4` or add `gap-2` to the container for better breathing room.
- **Alignment:** Center icons perfectly within the 80px width.
- **Section Headers:** Hide section headers completely in collapsed mode to reduce clutter.

### 3. Visual Style

- **Minimalism:** Remove unnecessary borders or backgrounds in collapsed mode.
- **Logo:** Simplify the logo presentation in collapsed mode (just the icon, no text).

## Implementation Plan

1.  Update `admin-web/src/components/Layout.tsx`:
    - Modify `NavItem` component to accept `isCollapsed` prop.
    - Conditionally render icon size (`24` vs `20`) and stroke width (`1.5` vs `2`).
    - Adjust padding and margins in the `nav` container.
2.  Update `admin-web/src/index.css` if global styles interfere (unlikely, mostly Tailwind).

## User Approval

Confirmed via `AskQuestion` tool on 2026-03-07.
