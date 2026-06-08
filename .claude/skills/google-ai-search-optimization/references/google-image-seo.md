# Google Image SEO Best Practices

**Source:** Google Search Central — `developers.google.com/search/docs/appearance/google-images`

**Status:** Canonical reference for image-related decisions during an audit. The AI Search guide explicitly names image SEO as part of optimizing for generative AI search — relevant images and video can be surfaced in AI Overviews and AI Mode, expanding visibility beyond web page links. Treat this file as authoritative for any image question that arises in Pillar 1 (visual support of content) or Pillar 2 (technical indexability of images).

---

## Overview

Google offers several Search features and products that help users visually discover information on the web, such as text result images, Google Discover, and Google Images. The recommendations for getting images to appear in them are largely the same.

Two top-level practices to follow:

1. Help Google discover and index images
2. Optimize the image landing pages

## Help Google discover and index images

The Search technical requirements apply to images too. Because images are a different format than HTML, there are additional requirements — how Google finds images on a site, and how the images are presented, both influence whether an image is indexed and for the right keywords.

### Use HTML image elements

Use standard HTML image elements so crawlers can find and process images. Google finds images in the `src` attribute of `<img>` elements (even as children of other elements like `<picture>`). Google does not index CSS background images.

- **Good:** `<img src="puppy.jpg" alt="A golden retriever puppy" />`
- **Bad:** `<div style="background-image:url(puppy.jpg)">A golden retriever puppy</div>`

### Use an image sitemap

Submit an image sitemap to provide URLs Google might not otherwise discover. Unlike regular sitemaps, image sitemaps can include URLs from other domains in `<image:loc>` elements, which lets sites use CDNs to host images. If using a CDN, verify ownership of the CDN domain in Search Console so crawl errors are surfaced.

### Responsive images

Responsive design improves user experience across device types. Pages typically use the `<picture>` element or the `srcset` attribute on `<img>` to specify responsive images. Some browsers and crawlers do not understand these attributes — always specify a fallback URL using the `src` attribute.

Example `srcset`:

```html
<img
  srcset="maine-coon-nap-320w.jpg 320w, maine-coon-nap-480w.jpg 480w, maine-coon-nap-800w.jpg 800w"
  sizes="(max-width: 320px) 280px, (max-width: 480px) 440px, 800px"
  src="maine-coon-nap-800w.jpg"
  alt="A watercolor illustration of a maine coon napping leisurely in front of a fireplace">
```

Example `<picture>` with fallback:

```html
<picture>
  <source type="image/svg+xml" srcset="pyramid.svg">
  <source type="image/webp" srcset="pyramid.webp">
  <img src="pyramid.png" alt="An 1800s oil painting of The Great Pyramid">
</picture>
```

### Supported image formats

Google Search supports images referenced in `<img src>` in the following formats: BMP, GIF, JPEG, PNG, WebP, SVG, and AVIF. Match the filename extension to the file type.

Inline images via Data URIs are supported by setting `src` to a Base64-encoded string:

```html
<img src="data:image/svg+xml;base64,[data]">
```

Inlining reduces HTTP requests but can substantially increase page size. Use it judiciously.

### Optimize for speed and quality

High-quality, sharp photos appeal to users more than blurry images. Sharp images also perform better in result thumbnails and can increase click-through. But images are often the largest contributor to overall page size, which slows load. Apply image optimization and responsive image techniques to deliver both quality and speed. Analyze site speed with PageSpeed Insights.

## Optimize the image landing pages

The content and metadata of the pages where an image is embedded heavily influence how and where the image may appear in Google's search results.

### Specify a preferred image with metadata

Google's selection of an image preview is automated and pulls from multiple sources. Influence which image is selected by providing a preferred image through one of:

- **`schema.org/primaryImageOfPage`** as `URL` or `ImageObject`:

  ```json
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": "https://example.com/url",
    "primaryImageOfPage": "https://example.com/images/cat.png"
  }
  ```

- **Image on the main entity** via `mainEntity` or `mainEntityOfPage`:

  ```json
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": "https://example.com/url",
    "image": "https://example.com/images/cat.png"
  }
  ```

- **Open Graph image** meta tag:

  ```html
  <meta property="og:image" content="https://example.com/images/cat.png">
  ```

Best practices when choosing a preferred image:

- Pick an image that is relevant and representative of the page
- Avoid generic images such as the site logo or images with text overlaid
- Avoid extreme aspect ratios (too narrow, overly wide)
- Use a high resolution

### Page title and description

Google generates the title link and snippet automatically, drawing on `<title>`, `<meta>`, and other sources. Follow Google's title and snippet guidelines to help that automation produce strong results.

### Structured data

Structured data can make images eligible for rich results in Google Images, including prominent badges. The `image` attribute is required in supported structured data types to be eligible for badge and rich result display.

For schema markup execution, cross-reference the `website-schema-builder` skill.

### Descriptive filenames, titles, and alt text

Google extracts information about an image's subject from page content — captions, surrounding text, and image titles. Place images near relevant text on pages relevant to the image subject.

Filenames give Google a light signal:

- Use short, descriptive filenames: `my-new-black-kitten.jpg` is better than `IMG00023.JPG`
- Avoid generic filenames like `image1.jpg`, `pic.gif`, `1.jpg`
- For sites with thousands of images, automate naming
- If images are localized, translate the filenames, following URL encoding guidelines for non-Latin or special characters

**Alt text is the most important image metadata signal.** It also improves accessibility for screen reader users and users on low-bandwidth connections. Google uses alt text along with computer vision and page content to understand the image. Alt text on linked images doubles as anchor text.

When writing alt text:

- Create useful, information-rich content
- Use keywords appropriately and in context
- Do not stuff keywords — that violates spam policy and degrades user experience

Examples on a puppy image:

- **Bad (missing alt text):** `<img src="puppy.jpg"/>`
- **Bad (keyword stuffing):** `<img src="puppy.jpg" alt="puppy dog baby dog pup pups puppies doggies pups litter puppies dog retriever labrador wolfhound setter pointer puppy jack russell terrier puppies dog food cheap dogfood puppy food"/>`
- **Better:** `<img src="puppy.jpg" alt="puppy"/>`
- **Best:** `<img src="puppy.jpg" alt="Dalmatian puppy playing fetch"/>`

For accessibility on inline `<svg>` elements, use the `<title>` element with `aria-labelledby`:

```html
<svg aria-labelledby="svgtitle1">
  <title id="svgtitle1">Googlebot wearing an apron and chef hat, struggling to make pancakes on the stovetop</title>
</svg>
```

For accessibility execution beyond alt text and SVG titles, cross-reference the `web-accessibility` skill.

If an image is referenced on multiple pages, reference it with the same URL consistently so Google can cache and reuse it without re-requesting.

## Opt out of inline linking in Google Images

Sites that do not want full-sized images shown in Google Images can opt out by:

1. Inspecting the HTTP referrer header on image requests
2. Returning a `200` HTTP status with no content, or a `204` status, when the request comes from a Google domain

Google will still crawl the page and see the image but will show a thumbnail generated at crawl time. This is not cloaking and does not trigger manual actions. To remove images from search results entirely, follow Google's "prevent images on your page" guidance instead.

## Optimize for SafeSearch

SafeSearch is a user setting that controls whether explicit images, videos, and websites appear in Google Search. Make the nature of the site clear to Google so SafeSearch filters apply correctly.

---

## Why this matters for AI Search

Three direct connections back to the AI Search optimization workflow:

- **Images can appear directly in AI Search experiences.** AI Overviews and AI Mode can surface relevant images alongside text answers. Strong image SEO expands a site's surface area in generative search, not just standard Search.
- **Image indexability is a Pillar 2 floor.** If Google cannot find or process images (CSS backgrounds, blocked CDN, broken sitemap, no `<img>` tags), they cannot appear anywhere — Search or AI Search.
- **Image quality and context support Pillar 1.** The AI Search guide explicitly says to support textual content with high-quality, relevant images and video where it makes sense. Alt text, captions, surrounding content, and preferred-image metadata all feed into the same content quality signal the rest of Pillar 1 covers.

When an audit surfaces image-related fixes, hand off execution to the appropriate sibling skill: `website-schema-builder` for structured data, `web-accessibility` for alt text and SVG accessibility, `eeat-content-writer` for image-supported content rewrites.
