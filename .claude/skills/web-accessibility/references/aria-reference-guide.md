# ARIA (Accessible Rich Internet Applications) — Complete Developer Reference Guide

**Source Authority:** W3C WAI-ARIA 1.2 Specification + ARIA Authoring Practices Guide (APG)  
**Compliance Relevance:** WCAG 2.1 SC 4.1.2 (Name, Role, Value) — Level A  
**Primary Rule:** If a native HTML element can do the job, use it. ARIA is for when native HTML falls short.

---

## THE 5 RULES OF ARIA (W3C Official)

1. **Don't use ARIA if you can use native HTML.** `<button>` is better than `<div role="button">`.
2. **Don't change native semantics unless absolutely necessary.** Don't add `role="heading"` to a `<button>`.
3. **All interactive ARIA controls must be keyboard operable.** If you build it with ARIA, you must wire up keyboard events.
4. **Never use `role="presentation"` or `aria-hidden="true"` on a focusable element.** It creates invisible traps.
5. **All interactive elements must have an accessible name.** Every button, input, and link must be identifiable.

---

## SECTION 1: NAMING ATTRIBUTES
*How screen readers identify what an element IS.*

---

### `aria-label`
Provides an invisible text label directly on the element. Use when there is no visible text label on screen.

**When to use:**
- Icon-only buttons
- Close/dismiss buttons
- Search inputs with no visible label
- Landmark regions that need differentiation (two `<nav>` elements)

**When NOT to use:**
- When a visible label exists — use `aria-labelledby` instead
- On non-interactive elements (screen readers ignore it on `<div>`, `<p>`, etc.)

```html
<!-- CORRECT: Icon-only button -->
<button aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

<!-- CORRECT: Search input with no visible label -->
<input type="search" aria-label="Search products" />

<!-- CORRECT: Two navigation landmarks differentiated -->
<nav aria-label="Primary">...</nav>
<nav aria-label="Footer">...</nav>

<!-- WRONG: Redundant when visible text exists -->
<button aria-label="Submit form">Submit</button>
<!-- Just use: <button>Submit</button> -->

<!-- WRONG: Conflicts with visible text -->
<button aria-label="Delete account">Remove user</button>
<!-- Screen reader says "Delete account" but sighted user sees "Remove user" -->
```

---

### `aria-labelledby`
Points to the ID(s) of one or more visible elements that serve as the label. Screen readers concatenate multiple IDs in order.

**When to use:**
- When a visible heading or text IS the label
- Modal dialogs (the dialog title labels the whole dialog)
- Form sections with visible group headings
- When you need to compose a label from multiple elements

**Priority:** `aria-labelledby` OVERRIDES `aria-label` and native `<label>` elements.

```html
<!-- CORRECT: Modal dialog labeled by its visible heading -->
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Confirm Account Deletion</h2>
  <p>This action cannot be undone.</p>
</div>

<!-- CORRECT: Composing a label from multiple elements -->
<!-- Screen reader announces: "John Smith Edit button" -->
<span id="name">John Smith</span>
<button aria-labelledby="name action-label">
  <span id="action-label">Edit</span>
</button>

<!-- CORRECT: Form input labeled by adjacent visible text -->
<span id="qty-label">Quantity</span>
<input type="number" aria-labelledby="qty-label" min="1" max="99" />

<!-- WRONG: Referencing an ID that doesn't exist -->
<button aria-labelledby="nonexistent-id">Save</button>
```

---

### `aria-describedby`
Points to an element that provides supplementary description — additional context beyond the label.

**When to use:**
- Error messages on form fields
- Password strength requirements
- Tooltips with extra detail
- Instructions that apply to a form group

**Key distinction:** `aria-labelledby` = the NAME. `aria-describedby` = additional DETAIL about it.

```html
<!-- CORRECT: Input with error message -->
<label for="email">Email address</label>
<input 
  type="email" 
  id="email" 
  aria-describedby="email-error"
  aria-invalid="true"
/>
<span id="email-error" role="alert">
  Enter a valid email address (e.g. name@domain.com)
</span>

<!-- CORRECT: Password field with requirements -->
<label for="password">Password</label>
<input 
  type="password" 
  id="password" 
  aria-describedby="password-requirements"
/>
<ul id="password-requirements">
  <li>At least 8 characters</li>
  <li>One uppercase letter</li>
  <li>One number</li>
</ul>

<!-- CORRECT: Button with additional tooltip context -->
<button aria-describedby="delete-tooltip">Delete</button>
<div id="delete-tooltip" role="tooltip">
  Permanently removes this item and all associated data
</div>
```

---

### `aria-description` *(WAI-ARIA 1.3 — emerging)*
Direct string alternative to `aria-describedby`. Not yet widely supported — use `aria-describedby` for production.

```html
<!-- Future use when widely supported -->
<input type="text" aria-description="Must be 6–12 characters, no spaces" />
```

---

## SECTION 2: LANDMARK ROLES
*How screen reader users navigate page regions — equivalent to a visual page layout.*

**The rule:** Every page should have exactly ONE `<main>`. Landmark regions replace the need for `aria-label` on many structural elements.

| Role | HTML Equivalent | Purpose |
|------|----------------|---------|
| `banner` | `<header>` (top level) | Site header |
| `navigation` | `<nav>` | Navigation links |
| `main` | `<main>` | Primary content |
| `complementary` | `<aside>` | Supporting content |
| `contentinfo` | `<footer>` (top level) | Site footer |
| `search` | `<search>` | Search functionality |
| `form` | `<form>` (with accessible name) | Form region |
| `region` | `<section>` (with accessible name) | Named section |

```html
<!-- CORRECT: Full semantic landmark structure -->
<header>                          <!-- role="banner" implicitly -->
  <nav aria-label="Primary">      <!-- role="navigation" implicitly -->
    <ul>...</ul>
  </nav>
</header>

<main>                            <!-- role="main" implicitly -->
  <section aria-labelledby="news-heading">  <!-- role="region" when named -->
    <h2 id="news-heading">Latest News</h2>
    ...
  </section>
  
  <aside aria-label="Related articles"> <!-- role="complementary" implicitly -->
    ...
  </aside>
</main>

<footer>                          <!-- role="contentinfo" implicitly -->
  <nav aria-label="Footer">
    ...
  </nav>
</footer>

<!-- ONLY use role= when you cannot use native HTML -->
<div role="main">...</div>        <!-- Only if <main> is not available -->
```

---

## SECTION 3: WIDGET ROLES
*For custom interactive components that have no native HTML equivalent.*

---

### Buttons and Controls

```html
<!-- role="button" — only when <button> is not usable -->
<div 
  role="button" 
  tabindex="0"
  aria-pressed="false"
  onclick="toggleMute()"
  onkeydown="handleKey(event)"
>
  Mute
</div>
<!-- Must handle: Enter key = activate, Space key = activate -->

<!-- Toggle button with aria-pressed -->
<button aria-pressed="false" id="bold-btn">Bold</button>
<!-- JavaScript: btn.setAttribute('aria-pressed', 'true') on toggle -->

<!-- aria-expanded for show/hide controls -->
<button aria-expanded="false" aria-controls="menu-list">
  Products
</button>
<ul id="menu-list" hidden>
  <li><a href="/widgets">Widgets</a></li>
</ul>
```

---

### Navigation and Menus

```html
<!-- Tabs pattern — full implementation -->
<div role="tablist" aria-label="Account sections">
  <button 
    role="tab" 
    id="tab-profile" 
    aria-selected="true" 
    aria-controls="panel-profile"
    tabindex="0"
  >
    Profile
  </button>
  <button 
    role="tab" 
    id="tab-billing" 
    aria-selected="false" 
    aria-controls="panel-billing"
    tabindex="-1"
  >
    Billing
  </button>
</div>

<div 
  role="tabpanel" 
  id="panel-profile" 
  aria-labelledby="tab-profile"
>
  Profile content here
</div>
<div 
  role="tabpanel" 
  id="panel-billing" 
  aria-labelledby="tab-billing"
  hidden
>
  Billing content here
</div>
<!-- Keyboard: Arrow keys move between tabs. Enter/Space activates. -->

<!-- Navigation menu (not application menu) -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><span aria-current="page">Widgets</span></li>
  </ol>
</nav>
```

---

### Dialogs and Modals

```html
<!-- Full modal dialog implementation -->
<div 
  role="dialog" 
  aria-labelledby="modal-title" 
  aria-describedby="modal-desc"
  aria-modal="true"
  tabindex="-1"
>
  <h2 id="modal-title">Confirm Purchase</h2>
  <p id="modal-desc">
    You are about to purchase 3 items for $47.99. 
    This charge will appear on your credit card.
  </p>
  <button onclick="confirmPurchase()">Confirm</button>
  <button onclick="closeModal()">Cancel</button>
</div>
<!-- On open: move focus to the dialog element or first focusable item -->
<!-- Trap Tab/Shift+Tab inside the dialog -->
<!-- Escape key must close the dialog -->
<!-- On close: return focus to the element that triggered the dialog -->

<!-- Non-modal dialog (alertdialog for urgent messages) -->
<div 
  role="alertdialog" 
  aria-labelledby="alert-title" 
  aria-describedby="alert-desc"
>
  <h2 id="alert-title">Session Expiring</h2>
  <p id="alert-desc">Your session will expire in 2 minutes.</p>
  <button>Stay Logged In</button>
</div>
```

---

### Forms and Inputs

```html
<!-- Grouping related form fields -->
<fieldset>
  <legend>Shipping Address</legend>
  <label for="street">Street</label>
  <input type="text" id="street" autocomplete="street-address" />
  
  <label for="city">City</label>
  <input type="text" id="city" autocomplete="address-level2" />
</fieldset>

<!-- Radio group with ARIA (prefer native fieldset/legend) -->
<div role="radiogroup" aria-labelledby="size-label">
  <span id="size-label">T-Shirt Size</span>
  <label>
    <input type="radio" name="size" value="s" /> Small
  </label>
  <label>
    <input type="radio" name="size" value="m" /> Medium
  </label>
</div>

<!-- Custom checkbox -->
<div 
  role="checkbox" 
  aria-checked="false" 
  tabindex="0"
  id="custom-check"
  onkeydown="handleCheck(event)"
  onclick="toggleCheck()"
>
  I agree to the terms
</div>
<!-- Must handle: Space key = toggle. Enter key = toggle. -->

<!-- Combobox / Autocomplete -->
<label for="country-input">Country</label>
<input 
  type="text" 
  id="country-input" 
  role="combobox" 
  aria-expanded="false"
  aria-autocomplete="list"
  aria-controls="country-list"
  aria-activedescendant=""
/>
<ul id="country-list" role="listbox" hidden>
  <li role="option" id="opt-us" aria-selected="false">United States</li>
  <li role="option" id="opt-ca" aria-selected="false">Canada</li>
</ul>
```

---

### Sliders and Range Controls

```html
<!-- Custom slider -->
<div 
  role="slider"
  aria-valuenow="40"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="40 percent"
  aria-label="Volume"
  tabindex="0"
>
  <div class="thumb" style="left: 40%"></div>
</div>
<!-- Keyboard: Arrow keys change value. Home = min. End = max. -->
<!-- Update aria-valuenow AND aria-valuetext dynamically via JS -->

<!-- When value has a non-numeric label -->
<div 
  role="slider"
  aria-valuenow="2"
  aria-valuemin="1"
  aria-valuemax="4"
  aria-valuetext="Medium"
  aria-label="Spice level"
  tabindex="0"
></div>
```

---

### Trees, Grids, and Listboxes

```html
<!-- Listbox (single-select) -->
<ul 
  role="listbox" 
  aria-label="Sort by" 
  aria-activedescendant="sort-date"
  tabindex="0"
>
  <li role="option" id="sort-date" aria-selected="true">Date</li>
  <li role="option" id="sort-name" aria-selected="false">Name</li>
  <li role="option" id="sort-price" aria-selected="false">Price</li>
</ul>

<!-- Grid (interactive data table) -->
<div role="grid" aria-label="Employee directory">
  <div role="row">
    <div role="columnheader" aria-sort="ascending">Name</div>
    <div role="columnheader" aria-sort="none">Department</div>
  </div>
  <div role="row">
    <div role="gridcell">Jane Smith</div>
    <div role="gridcell">Engineering</div>
  </div>
</div>
<!-- Use <table> with native th/td for non-interactive data. Grid is for interactive spreadsheet-like tables. -->

<!-- Tree (hierarchical navigation) -->
<ul role="tree" aria-label="File system">
  <li role="treeitem" aria-expanded="true">
    Documents
    <ul role="group">
      <li role="treeitem" aria-expanded="false">Reports</li>
      <li role="treeitem">Resume.docx</li>
    </ul>
  </li>
</ul>
```

---

## SECTION 4: STATES AND PROPERTIES
*Dynamic attributes updated via JavaScript to reflect current component state.*

---

### Visibility and Interaction States

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `aria-hidden` | `true` / `false` | Remove element from accessibility tree |
| `aria-disabled` | `true` / `false` | Mark as non-interactive (but still readable) |
| `aria-expanded` | `true` / `false` | Show/hide state of controlled content |
| `aria-pressed` | `true` / `false` / `mixed` | Toggle button state |
| `aria-checked` | `true` / `false` / `mixed` | Checkbox/radio state |
| `aria-selected` | `true` / `false` | Selection state in listboxes, tabs, grids |
| `aria-current` | `page` / `step` / `date` / `location` / `true` / `false` | Current item in a set |

```html
<!-- aria-hidden: removes from screen reader entirely -->
<!-- USE FOR: decorative icons, duplicate content, offscreen content -->
<svg aria-hidden="true" focusable="false">...</svg>
<span aria-hidden="true">★★★★☆</span>
<span class="sr-only">4 out of 5 stars</span>

<!-- NEVER DO: aria-hidden on focusable elements -->
<button aria-hidden="true">Submit</button> <!-- WRONG — creates keyboard trap -->

<!-- aria-disabled vs disabled attribute -->
<button disabled>Submit</button>         <!-- Removed from tab order entirely -->
<button aria-disabled="true">Submit</button> <!-- Still reachable, announces as disabled -->
<!-- Use aria-disabled when you want to communicate WHY it's disabled -->

<!-- aria-expanded: always on the TRIGGER, not the content -->
<button 
  aria-expanded="false" 
  aria-controls="submenu"
>
  Services
</button>
<ul id="submenu" hidden>...</ul>
<!-- JS: toggle hidden on ul, toggle aria-expanded on button simultaneously -->

<!-- aria-current: mark active state in nav -->
<nav aria-label="Primary">
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>

<!-- aria-current in multi-step flow -->
<ol>
  <li aria-current="step">Shipping</li>
  <li>Payment</li>
  <li>Confirmation</li>
</ol>
```

---

### Form Validation States

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `aria-invalid` | `true` / `false` / `grammar` / `spelling` | Field has an error |
| `aria-required` | `true` / `false` | Field is required |
| `aria-readonly` | `true` / `false` | Field is read-only |
| `aria-multiselectable` | `true` / `false` | Multiple items can be selected |
| `aria-multiline` | `true` / `false` | Text input accepts multiple lines |

```html
<!-- Required field -->
<label for="fname">
  First Name <span aria-hidden="true">*</span>
</label>
<input 
  type="text" 
  id="fname" 
  aria-required="true"
  autocomplete="given-name"
/>
<!-- Note: Don't use required attribute alone; aria-required gives screen readers the message. Use both together. -->

<!-- Field in error state -->
<label for="dob">Date of Birth</label>
<input 
  type="text" 
  id="dob" 
  aria-invalid="true"
  aria-describedby="dob-error"
/>
<span id="dob-error" role="alert">
  Date must be in MM/DD/YYYY format
</span>
<!-- aria-invalid should be false (or removed) when error is corrected -->

<!-- Full form field pattern: required + error -->
<label for="email">
  Email <span aria-hidden="true">*</span>
</label>
<input 
  type="email" 
  id="email" 
  aria-required="true"
  aria-invalid="true"
  aria-describedby="email-hint email-error"
/>
<span id="email-hint">We'll send your receipt here</span>
<span id="email-error" role="alert">Email address is required</span>
```

---

### Value-Based Properties

| Attribute | Purpose |
|-----------|---------|
| `aria-valuenow` | Current numeric value |
| `aria-valuemin` | Minimum value |
| `aria-valuemax` | Maximum value |
| `aria-valuetext` | Human-readable value label |

```html
<!-- Progress bar -->
<div 
  role="progressbar" 
  aria-valuenow="65" 
  aria-valuemin="0" 
  aria-valuemax="100"
  aria-valuetext="65% complete"
  aria-label="File upload progress"
>
  <div style="width: 65%"></div>
</div>
<!-- Update aria-valuenow and aria-valuetext via JS as value changes -->

<!-- Indeterminate progress (loading spinner) -->
<div 
  role="progressbar" 
  aria-label="Loading content"
  aria-valuetext="Loading..."
>
  <!-- spinner animation -->
</div>
```

---

## SECTION 5: LIVE REGIONS
*How screen readers announce dynamic content changes without the user's focus moving.*

**The cardinal rule:** Only use live regions for content the user needs to know about immediately. Overuse causes announcement fatigue.

---

### `aria-live` Values

| Value | Behavior | Use Case |
|-------|----------|----------|
| `polite` | Announces after user stops interacting | Success messages, search results count, cart updates |
| `assertive` | Interrupts immediately | Critical errors, session timeout warnings |
| `off` | No announcement (default) | Content that doesn't need announcement |

```html
<!-- Status message (polite) -->
<div aria-live="polite" aria-atomic="true" id="status-msg">
  <!-- Inject: "3 results found for 'widget'" via JS -->
</div>

<!-- Error / alert (assertive — use sparingly) -->
<div aria-live="assertive" aria-atomic="true" role="alert">
  <!-- Inject: "Your session will expire in 60 seconds" -->
</div>

<!-- The trick: inject content INTO a pre-existing live region -->
<!-- WRONG: Creating the live region and adding content at same time -->
<script>
  // WRONG — content injected with the element; screen readers miss it
  container.innerHTML = '<div aria-live="polite">Item added to cart</div>';
</script>

<!-- CORRECT pattern -->
<div id="cart-status" aria-live="polite" aria-atomic="true"></div>
<script>
  // Live region exists on page load; inject content into it dynamically
  document.getElementById('cart-status').textContent = 'Item added to cart';
</script>
```

---

### `aria-atomic`

Controls whether the entire region is announced or just the changed part.

```html
<!-- aria-atomic="true": announce the whole region even if only part changed -->
<!-- Use for: status messages, counts, alerts -->
<div aria-live="polite" aria-atomic="true">
  Showing 1–20 of 847 results
</div>

<!-- aria-atomic="false" (default): only announce the changed node -->
<!-- Use for: chat feeds, news tickers, log outputs -->
<ul aria-live="polite" aria-atomic="false" role="log">
  <li>User A joined</li>
  <li>User B sent a message</li>
  <!-- New items appended; only the new item is announced -->
</ul>
```

---

### `aria-relevant`

What type of changes trigger announcement. Rarely needs to be set explicitly.

```html
<!-- Default behavior: additions and text changes (aria-relevant="additions text") -->

<!-- Only announce additions (e.g., chat messages) -->
<div aria-live="polite" aria-relevant="additions">...</div>

<!-- Announce additions and removals (e.g., notification count badge) -->
<div aria-live="polite" aria-relevant="additions removals">
  <span>3 notifications</span>
</div>
```

---

### Shorthand Role Equivalents

```html
<!-- role="status" = aria-live="polite" aria-atomic="true" -->
<div role="status">Changes saved successfully</div>

<!-- role="alert" = aria-live="assertive" aria-atomic="true" -->
<div role="alert">Error: Unable to save changes. Please try again.</div>

<!-- role="log" = aria-live="polite" aria-relevant="additions" aria-atomic="false" -->
<div role="log" aria-label="Chat messages">...</div>

<!-- role="timer" — for countdowns/countups -->
<div role="timer" aria-live="off" aria-label="Time remaining">
  02:34
</div>
<!-- Announce sparingly — only at meaningful intervals via JS -->
```

---

## SECTION 6: RELATIONSHIP ATTRIBUTES
*How ARIA links related elements to each other.*

| Attribute | Purpose |
|-----------|---------|
| `aria-controls` | This element controls that element |
| `aria-owns` | This element is the logical parent of those elements |
| `aria-haspopup` | This element triggers a popup |
| `aria-activedescendant` | Which descendant is currently active/focused |
| `aria-flowto` | Reading order override |
| `aria-posinset` | Position in a set |
| `aria-setsize` | Total size of the set |

```html
<!-- aria-controls: button controls a panel -->
<button aria-expanded="false" aria-controls="filter-panel">
  Filters
</button>
<div id="filter-panel" hidden>...</div>

<!-- aria-haspopup: triggers a popup menu/dialog/listbox -->
<button aria-haspopup="menu" aria-expanded="false">
  Options
</button>
<ul role="menu" hidden>
  <li role="menuitem">Edit</li>
  <li role="menuitem">Delete</li>
</ul>
<!-- aria-haspopup values: menu | listbox | tree | grid | dialog -->

<!-- aria-activedescendant: focus stays on container, 
     highlights descendant without moving DOM focus -->
<ul 
  role="listbox" 
  tabindex="0" 
  aria-activedescendant="opt-2"
  aria-label="Country"
>
  <li role="option" id="opt-1" aria-selected="false">Canada</li>
  <li role="option" id="opt-2" aria-selected="true">United States</li>
  <li role="option" id="opt-3" aria-selected="false">Mexico</li>
</ul>

<!-- aria-posinset and aria-setsize: for virtualized lists -->
<!-- When not all items are in the DOM at once -->
<ul role="listbox">
  <li role="option" aria-posinset="1" aria-setsize="500">Item 1</li>
  <li role="option" aria-posinset="2" aria-setsize="500">Item 2</li>
  <!-- Virtual scroll: only 20 items in DOM, but 500 total -->
</ul>

<!-- aria-owns: when DOM order doesn't match logical parent -->
<!-- Use sparingly — restructuring the DOM is almost always better -->
<div role="listbox" aria-owns="opt-a opt-b">
  <div id="opt-a" role="option">Option A</div>
</div>
<div id="opt-b" role="option">Option B</div>
<!-- opt-b is logically inside the listbox even though it's outside in DOM -->
```

---

## SECTION 7: STRUCTURAL / DOCUMENT ROLES
*For annotating document structure when native HTML semantics are not sufficient.*

```html
<!-- role="presentation" or role="none": removes native semantics -->
<!-- USE FOR: layout tables, decorative elements -->
<table role="presentation">
  <tr><td>...</td><td>...</td></tr>
</table>
<!-- Removes the table semantics so screen readers don't announce it as a data table -->

<!-- role="img": make a group of elements function as a single image -->
<div role="img" aria-label="Bar chart showing Q4 revenue by region">
  <!-- SVG or canvas elements inside -->
</div>

<!-- role="figure" with caption -->
<figure>
  <img src="diagram.png" alt="System architecture diagram" />
  <figcaption>Figure 1: Three-tier system architecture</figcaption>
</figure>

<!-- role="separator": visual and semantic divider -->
<hr role="separator" aria-orientation="horizontal" />

<!-- Heading levels via ARIA (prefer native <h1>–<h6> always) -->
<div role="heading" aria-level="2">Section Title</div>
<!-- Only use if native heading elements are genuinely unavailable -->

<!-- role="definition" and role="term" -->
<dl>
  <dt>WCAG</dt>
  <dd>Web Content Accessibility Guidelines — the international standard for web accessibility.</dd>
</dl>
<!-- Prefer native <dl><dt><dd> over role="term" / role="definition" -->

<!-- role="note" -->
<div role="note">
  <strong>Note:</strong> This feature requires a paid plan.
</div>
```

---

## SECTION 8: COMMON COMPONENT PATTERNS (FULL IMPLEMENTATIONS)

---

### Accordion

```html
<div id="accordion">
  <h3>
    <button 
      aria-expanded="false" 
      aria-controls="panel-1"
      id="accordion-btn-1"
    >
      What is your return policy?
    </button>
  </h3>
  <div 
    id="panel-1" 
    role="region" 
    aria-labelledby="accordion-btn-1"
    hidden
  >
    <p>We offer 30-day returns on all items...</p>
  </div>
</div>
<!-- JavaScript: toggle hidden + aria-expanded on button click -->
<!-- Keyboard: Enter or Space activates the button -->
```

---

### Tooltip

```html
<button 
  aria-describedby="copy-tooltip"
  id="copy-btn"
>
  Copy
</button>
<div 
  id="copy-tooltip" 
  role="tooltip"
  hidden
>
  Copy text to clipboard
</div>
<!-- Show tooltip on focus and hover; hide on blur/mouseleave -->
<!-- Never put interactive content (links/buttons) inside a tooltip -->
```

---

### Skip Navigation Link

```html
<!-- Must be the FIRST focusable element on every page -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<header>...</header>
<main id="main-content" tabindex="-1">
  <!-- tabindex="-1" allows programmatic focus without adding to tab order -->
  ...
</main>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
}
.skip-link:focus {
  top: 0;  /* Visible only on focus */
}
</style>
```

---

### Breadcrumb

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/products/widgets">Widgets</a></li>
    <li>
      <a href="/products/widgets/blue" aria-current="page">
        Blue Widget
      </a>
    </li>
  </ol>
</nav>
```

---

### Notification Badge / Count

```html
<!-- Cart button with live item count -->
<button>
  Cart
  <span aria-live="polite" aria-atomic="true">
    <span class="visually-hidden">Items in cart: </span>
    <span id="cart-count">3</span>
  </span>
</button>
<!-- Update #cart-count via JS; live region announces the change -->
```

---

### Loading State

```html
<!-- Announce that content is loading -->
<div aria-live="polite" aria-busy="true" id="results">
  <p class="visually-hidden">Loading results, please wait...</p>
</div>

<!-- Once loaded -->
<div aria-live="polite" aria-busy="false" id="results">
  <!-- Inject results here -->
</div>
<!-- aria-busy="true" tells screen readers the content is still loading -->
```

---

## SECTION 9: THE `tabindex` ATTRIBUTE

*tabindex is not ARIA, but is essential to making ARIA work correctly.*

| Value | Effect |
|-------|--------|
| `tabindex="0"` | Adds element to natural tab order |
| `tabindex="-1"` | Removes from tab order but allows programmatic focus |
| `tabindex="1+"` | Positive values — **NEVER USE** — breaks natural tab order |

```html
<!-- Make a non-interactive element programmatically focusable -->
<div id="modal" tabindex="-1" role="dialog">...</div>
<script>document.getElementById('modal').focus();</script>

<!-- Add custom element to tab order -->
<div role="button" tabindex="0">Custom Button</div>

<!-- Visually hidden but programmatically focusable (for skip links) -->
<main id="main" tabindex="-1">...</main>

<!-- NEVER DO: positive tabindex -->
<input tabindex="3" /> <!-- Breaks the natural order for ALL users -->
```

---

## SECTION 10: VISUALLY HIDDEN CLASS (ARIA'S BEST FRIEND)

Screen-reader-only text that is invisible to sighted users but read aloud.

```css
/* The correct visually hidden class — do not use display:none or visibility:hidden */
.visually-hidden,
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Allow element to become visible on focus (for skip links) */
.visually-hidden:focus,
.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

```html
<!-- Usage: supplementary text for screen readers -->
<button>
  <svg aria-hidden="true">...</svg>
  <span class="visually-hidden">Close dialog</span>
</button>

<!-- Usage: add context to ambiguous links -->
<a href="/products/blue-widget">
  Learn more
  <span class="visually-hidden">about the Blue Widget</span>
</a>

<!-- Usage: icon + text where icon adds no information -->
<span aria-hidden="true">🛒</span>
<span class="visually-hidden">Cart: </span>
3 items
```

---

## SECTION 11: ANTI-PATTERNS — WHAT NEVER TO DO

```html
<!-- ❌ ARIA on every element -->
<p aria-label="Paragraph text">Paragraph text</p>
<!-- Redundant. Native HTML already gives this semantics. -->

<!-- ❌ role="presentation" on interactive elements -->
<button role="presentation">Submit</button>
<!-- Strips button semantics. Screen reader can't identify it. -->

<!-- ❌ aria-hidden on focused elements -->
<a href="/account" aria-hidden="true">My Account</a>
<!-- Creates keyboard trap: user tabs to it but it's invisible to screen reader. -->

<!-- ❌ Using aria-label instead of visible labels on forms -->
<input type="text" aria-label="Search" />
<!-- Acceptable for icon inputs ONLY. Prefer <label> for all form inputs. -->

<!-- ❌ Positive tabindex -->
<button tabindex="2">Submit</button>
<!-- Breaks tab order globally. Never use. -->

<!-- ❌ aria-describedby on decorative content -->
<img src="banner.jpg" alt="" aria-describedby="banner-text" />
<p id="banner-text">Welcome to our store!</p>
<!-- If the image is decorative (alt=""), it doesn't need a description. -->

<!-- ❌ Using ARIA to fix broken HTML -->
<div>
  <div role="heading" aria-level="1">Page Title</div>
</div>
<!-- Just use <h1>. -->

<!-- ❌ Dynamic aria-label updates to announce status -->
<button id="save-btn" aria-label="Save">Save</button>
<script>
  // WRONG: changing aria-label to announce a status
  btn.setAttribute('aria-label', 'Saved!');
</script>
<!-- Use a live region for status announcements instead. -->
```

---

## SECTION 12: QUICK DECISION TREE

**Do I need ARIA?**

```
Is there a native HTML element that does this?
  └── YES → Use the native element. You're done.
  └── NO → Is this element interactive?
               └── YES → Add role + tabindex="0" + keyboard event handlers + ARIA state
               └── NO → Does it need to communicate structure or live updates?
                           └── YES → Add appropriate role or aria-live region
                           └── NO → No ARIA needed
```

**Which naming attribute?**
```
Is there visible text that IS the label?
  └── YES → aria-labelledby pointing to its ID
  └── NO → Is there visible text nearby that describes it?
               └── YES → aria-describedby for supplementary info
               └── NO → aria-label with a concise label string
```

---

## KEY REFERENCE LINKS (Official W3C Sources)

- **WAI-ARIA 1.2 Specification:** https://www.w3.org/TR/wai-aria-1.2/
- **ARIA Authoring Practices Guide (APG):** https://www.w3.org/WAI/ARIA/apg/
- **ARIA in HTML (what's allowed where):** https://www.w3.org/TR/html-aria/
- **All ARIA Roles Reference:** https://www.w3.org/TR/wai-aria-1.2/#role_definitions
- **All ARIA States & Properties:** https://www.w3.org/TR/wai-aria-1.2/#state_prop_def
- **MDN ARIA Reference:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA

---

*Last updated based on WAI-ARIA 1.2 (W3C Recommendation, June 2023) and ARIA 1.3 Draft (2025). Always test with real assistive technologies — NVDA + Chrome, JAWS + Chrome, VoiceOver + Safari.*
