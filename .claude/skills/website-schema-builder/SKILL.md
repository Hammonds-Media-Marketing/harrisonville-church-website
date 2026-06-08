---
name: website-schema-builder
description: "Generate and audit JSON-LD structured data markup for any website page type. Use this skill whenever the user asks to write schema markup, add structured data, build JSON-LD, audit or validate existing schema, check for Google Rich Results eligibility, or generate schema for any page type — local business, FAQ, article, product, service, homepage, event, job posting, recipe, video, how-to, course, or any other. Also trigger when the user says \"schema,\" \"structured data,\" \"JSON-LD,\" \"rich snippets,\" \"rich results,\" \"structured markup,\" or asks Claude to \"add schema to,\" \"check the schema on,\" or \"validate the JSON-LD for\" any page or site. Always use this skill — never rely on general knowledge alone for schema tasks."
---
 
# Website Schema Builder
 
A comprehensive skill for generating and auditing JSON-LD structured data, grounded in the
schema.org specification (v29.4, source: https://github.com/schemaorg/schemaorg) and
Google's Rich Results guidelines.
 
---
 
## Mode Detection
 
Determine which mode to enter from the user's request:
 
| Signal | Mode |
|--------|------|
| "Generate schema for…", "Add schema to…", describes a business/page | **Generate** |
| "Audit my schema", "Check this JSON-LD", pastes existing code | **Audit — Paste** |
| "Check the schema on [URL]", provides a URL | **Audit — URL** |
| Both code and URL present | Use pasted code; fetch URL for additional context |
 
---
 
## MODE: GENERATE
 
### Step 1 — Identify Page Type
 
Ask or infer the page type. Map to primary + supporting schema types:
 
| Page | Primary Type | Supporting Types |
|------|-------------|-----------------|
| Homepage | `WebSite` + `Organization` or `LocalBusiness` | `SearchAction`, `ImageObject` (logo) |
| About Page | `AboutPage` + `Organization` or `Person` | `BreadcrumbList` |
| Contact Page | `ContactPage` | `LocalBusiness`, `PostalAddress`, `GeoCoordinates` |
| Blog Index | `CollectionPage` | `BreadcrumbList`, `WebSite` |
| Blog Post | `BlogPosting` | `Person` (author), `BreadcrumbList`, `ImageObject` |
| News Article | `NewsArticle` | `Organization` (publisher), `ImageObject` |
| General Article | `Article` | `Person` (author), `BreadcrumbList`, `ImageObject` |
| FAQ Page | `FAQPage` | `Question`, `Answer`, `BreadcrumbList` |
| How-To Page | `HowTo` | `HowToStep`, `HowToSupply`, `ImageObject` |
| Service Page | `Service` | `Organization`, `Offer`, `BreadcrumbList` |
| Product Page | `Product` | `Offer`, `AggregateRating`, `Review`, `BreadcrumbList` |
| Product Listing | `ItemList` or `CollectionPage` | `ListItem`, `Product` |
| Local Business | `LocalBusiness` (or specific subtype) | `PostalAddress`, `GeoCoordinates`, `OpeningHoursSpecification` |
| Event Page | `Event` | `Place`, `PostalAddress`, `Offer`, `VirtualLocation` |
| Recipe Page | `Recipe` | `Person` (author), `AggregateRating`, `NutritionInformation` |
| Video Page | `VideoObject` | `Person`, `BreadcrumbList` |
| Job Posting | `JobPosting` | `Organization`, `Place` |
| Author Profile | `ProfilePage` | `Person` |
| Review Page | `Review` or `AggregateRating` | `Product`, `LocalBusiness` |
| Course Page | `Course` | `Organization` (provider), `CourseInstance` |
| Software / App | `SoftwareApplication` | `Offer`, `AggregateRating` |
| Real Estate | `RealEstateListing` | `Place`, `Offer`, `FloorPlan` |
 
### Step 2 — Collect Required Inputs
 
Before generating, identify required vs. recommended properties for the detected type (see
Reference section). Ask the user for any missing required values. Do not invent placeholder
data — use clearly flagged `"REPLACE_ME"` strings where the user must supply a value.
 
### Step 3 — Generate JSON-LD
 
**Output format (always):**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TypeName",
  ...
}
</script>
```
 
**Core rules:**
- Always include `"@context": "https://schema.org"`
- Use `@graph` array when multiple types belong on the same page (e.g., `WebSite` +
  `Organization` on the homepage — place them in a single `@graph` block)
- Use `@id` with a full URL fragment for entities referenced across types
  (e.g., `"@id": "https://example.com/#organization"`)
- Reference reused entities via ID stub: `{ "@id": "https://example.com/#organization" }`
- Date fields: ISO 8601 format — `"2025-04-26"` or `"2025-04-26T09:00:00-05:00"`
- Images: use `ImageObject` with `url`, `width`, and `height`
- Phone numbers: E.164 format — `"+14055551234"`
- Prices: always include `priceCurrency` alongside `price`
- Durations: ISO 8601 — `"PT1H30M"` (1 hour 30 minutes)
**After the `<script>` block**, output a **Property Notes** section:
- Required fields filled
- Recommended fields included
- Optional fields omitted and why
- Any `REPLACE_ME` fields and instructions for completing them
---
 
## MODE: AUDIT
 
### Step 1 — Retrieve Schema
 
**Pasted code:** Parse the JSON-LD directly.
 
**URL provided:** Use `web_fetch` to retrieve the page HTML. Extract all
`<script type="application/ld+json">` blocks. If multiple blocks exist, analyze all of them.
 
### Step 2 — Validate Against Schema.org Spec
 
Check each block for:
- [ ] Valid `@context` value (`https://schema.org` or `http://schema.org`)
- [ ] Valid `@type` — must be a real schema.org type (verify at `https://schema.org/[TypeName]`)
- [ ] Required properties present for the declared type
- [ ] Property names valid for the declared type (no invented or misspelled properties)
- [ ] Nested entities correctly typed (e.g., `PostalAddress` inside `address`)
- [ ] Enum values match schema.org enumerations (see Reference section)
- [ ] `@id` values are absolute URLs when present
- [ ] Dates and durations in valid ISO 8601 format
### Step 3 — Validate Against Google Rich Results Rules
 
| Rich Result Type | Google's Key Requirements |
|-----------------|--------------------------|
| Article / BlogPosting / NewsArticle | `headline` ≤110 chars; `image` (min 1200px wide, min 696px tall); `datePublished`; `dateModified`; `author` with `name` and `url` or `sameAs` |
| Breadcrumb | `BreadcrumbList` → `ListItem` items each with `position` (integer), `name`, and `item` (URL) |
| FAQ | `FAQPage` → `mainEntity` array of `Question`, each with `name` and `acceptedAnswer` (`Answer` type with `text`) |
| HowTo | `HowTo` → `step` array of `HowToStep`; `image` and `totalTime` (ISO 8601 duration) strongly recommended |
| Event | `name`, `startDate`, `location` required; `eventStatus` and `eventAttendanceMode` required |
| Local Business | `name`, `address` (`PostalAddress`), `telephone`; `openingHoursSpecification` for hours display |
| Logo | `Organization` → `logo` as `ImageObject`; min 112×112px; max 1:1 aspect ratio; on homepage |
| Product | `name` required; `offers` (with `price`, `priceCurrency`, `availability`) for price display; `aggregateRating` or `review` for star ratings |
| Recipe | `name`, `image`, `author` required; `totalTime`, `recipeYield`, `recipeIngredient`, `recipeInstructions`, `nutrition` for rich result |
| Sitelinks Searchbox | `WebSite` → `potentialAction` of `SearchAction` with `target` URL template containing `{search_term_string}` |
| Video | `name`, `description`, `thumbnailUrl`, `uploadDate` required |
| Job Posting | `title`, `description`, `hiringOrganization`, `jobLocation`, `datePosted`, `validThrough` required |
| Course | `name`, `description`, `provider` required |
| SoftwareApplication | `name`, `operatingSystem`, `applicationCategory` required |
| Review Snippet | `Review` → `itemReviewed`, `reviewRating` (with `ratingValue`), `author` required |
 
### Step 4 — Output Audit Report
 
```
✅ VALID
  - [List what passes]
 
⚠️ WARNINGS (eligible but suboptimal — reduces richness)
  - [Issue + recommended fix]
 
❌ ERRORS (invalid or blocks Google Rich Results eligibility)
  - [Issue + specific correction]
 
🔧 IMPROVED SCHEMA
  [Corrected <script> block(s) with all issues resolved]
```
 
---
 
## Schema Type Reference
 
### LocalBusiness Subtypes — Use the Most Specific Applicable
`AccountingService` · `AnimalShelter` · `AutomotiveBusiness` · `ChildCare` · `Dentist` ·
`DryCleaningOrLaundry` · `EmergencyService` · `EmploymentAgency` · `EntertainmentBusiness` ·
`FinancialService` · `FoodEstablishment` → (`Restaurant`, `Bakery`, `CafeOrCoffeeShop`,
`FastFoodRestaurant`, `IceCreamShop`, `WineryOrVineyard`) · `GroceryOrSupermarket` ·
`HealthAndBeautyBusiness` → (`BeautySalon`, `DaySpa`, `HairSalon`, `NailSalon`, `TattooParlor`) ·
`HomeAndConstructionBusiness` → (`Electrician`, `GeneralContractor`, `HVACBusiness`,
`HousePainter`, `Locksmith`, `MovingCompany`, `Plumber`, `RoofingContractor`) ·
`InsuranceAgency` · `LegalService` → (`Attorney`, `Notary`) · `LodgingBusiness` →
(`BedAndBreakfast`, `Campground`, `Hostel`, `Hotel`, `Motel`, `Resort`) ·
`MedicalBusiness` → (`Dentist`, `MedicalClinic`, `Optician`, `Physician`, `VeterinaryCare`) ·
`ProfessionalService` · `RealEstateAgent` · `RecyclingCenter` · `SelfStorage` ·
`ShoppingCenter` · `SportsActivityLocation` → (`BowlingAlley`, `ExerciseGym`, `GolfCourse`,
`HealthClub`, `PublicSwimmingPool`, `TennisComplex`) · `Store` → (`AutoPartsStore`,
`BikeStore`, `BookStore`, `ClothingStore`, `ComputerStore`, `ElectronicsStore`,
`FlowerShop`, `FurnitureStore`, `HardwareStore`, `HobbyShop`, `HomeGoodsStore`,
`JewelryStore`, `PetStore`, `ShoeStore`, `SportingGoodsStore`, `ToyStore`) · `TravelAgency`
 
### Article Subtypes
`Article` → `NewsArticle` · `BlogPosting` · `TechArticle` · `ScholarlyArticle` · `Report` ·
`SocialMediaPosting` · `AdvertiserContentArticle`
 
### WebPage Subtypes
`WebPage` → `AboutPage` · `CheckoutPage` · `CollectionPage` · `ContactPage` · `FAQPage` ·
`ItemPage` · `MedicalWebPage` · `ProfilePage` · `QAPage` · `RealEstateListing` ·
`SearchResultsPage`
 
### Key Enumerations
 
**ItemAvailability:**
`InStock` · `OutOfStock` · `PreOrder` · `BackOrder` · `Discontinued` · `InStoreOnly` ·
`LimitedAvailability` · `OnlineOnly` · `PreSale` · `SoldOut`
 
**EventStatusType:**
`EventScheduled` · `EventCancelled` · `EventMovedOnline` · `EventPostponed` · `EventRescheduled`
 
**EventAttendanceModeEnumeration:**
`OfflineEventAttendanceMode` · `OnlineEventAttendanceMode` · `MixedEventAttendanceMode`
 
**DayOfWeek:**
`Monday` · `Tuesday` · `Wednesday` · `Thursday` · `Friday` · `Saturday` · `Sunday` ·
`PublicHolidays`
 
**OfferItemCondition:**
`NewCondition` · `UsedCondition` · `RefurbishedCondition` · `DamagedCondition`
 
---
 
## AEO / GEO Bonus Recommendations
 
For AI search visibility (GEO/AEO), always recommend adding:
- `speakable` on article/news pages (Google Assistant eligibility)
- `sameAs` on `Organization` and `Person` with authoritative profiles (LinkedIn, Wikidata,
  Crunchbase, social handles)
- `mainEntityOfPage` on articles linking back to the canonical URL
- `knowsAbout` on `Person` or `Organization` for topical authority signals
- `mentions` on articles to explicitly surface entities discussed
---
 
## Validation Tools
 
Always recommend the user verify final output at:
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Markup Validator:** https://validator.schema.org
- **Google Search Console:** https://search.google.com/search-console (for live crawl errors)
---
 
© 2026 Hammonds Media & Marketing (HMM). Proprietary and confidential.
This document may not be reproduced, shared, or used outside of
HMM-authorized projects without prior written consent.
Contact: hello@hmm.agency
