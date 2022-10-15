---
title: Introduce SEO
date: '2021-04-11'
description: 'Add SEO to site'
keyword: 'SEO, Sitemap, Meta tags'
order: 8
---

So I have a site but unless people can find it there will not be any visitors. Lets sort the sites SEO (Search Engine optimization).

## Sitemap

A **sitemap** tells search engines about your site. It will need to be automaticly generated to ensure its up to date with the content.

Start by updating the `next.config.js` file:

```
/* eslint-disable global-require */
module.exports = {
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      require('./lib/generateSiteMap');
    }

    return config;
  },
};
```

The code ensures a new script is called when Next build is run, this script will genterate the sitemap.

Next create the `generateSiteMap.js` file in the lib folder.

```
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const postsDirectory = path.join(process.cwd(), 'posts');

// Format to the right date
const formatDate = (date) => `${date.toISOString().split('.')[0]}+0:00`;
// Priority is determined by path depth. Feel free to modify this if needed:
const getPriority = (url) =>
  ((100 - (url.split('/').length - 2) * 10) / 100).toFixed(2);

// Just pick current date as last modified
const lastModified = formatDate(new Date());

// Set the header
const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

// Wrap all pages in <urlset> tags
const xmlUrlWrapper = (nodes) => `${xmlHeader}
  ${nodes}
</urlset>`;

// Determine and return the nodes for every page
const xmlUrlNode = (domain, pageUrl, lastmod) => {
  const url = `${pageUrl}${pageUrl === '/' ? '' : '/'}`;
  const loc = `${domain}${url}`;
  const priority = getPriority(url);

  return `<url>
  <loc>${loc}</loc>
  <lastmod>${lastmod}</lastmod>
  <priority>${priority}</priority>
</url>`;
};

function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => ({
    params: {
      id: fileName.replace(/\.md$/, ''),
    },
  }));
}

const paths = {
  '/': { page: '/' },
  '/intention': { page: '/intention' },
  '/todo': { page: '/todo' },
};

function generateSiteMap(domain, targetFolder) {
  const fileName = 'sitemap.xml';
  const writeLocation = `${
    targetFolder.endsWith('/') ? targetFolder : `${targetFolder}/`
  }${fileName}`;

  const postsIds = getAllPostIds();
  postsIds.forEach((post) => {
    paths[`/posts/${post.params.id}`] = {
      page: '/posts/[name]',
    };
  });

  const pages = Object.entries(paths).map((item) => item[0]);

  const sitemap = `${xmlUrlWrapper(
    pages.map((page) => xmlUrlNode(domain, page, lastModified)).join('')
  )}`;

  fs.writeFile(`${writeLocation}`, sitemap, (err) => {
    if (err) throw err;
    console.log(
      `sitemap.xml with ${pages.length} entries was written to ${targetFolder}${fileName}`
    );
  });
}

generateSiteMap('https://www.example.co.uk', './public/');
```

The script build the `sitemap.xml` file in to the pubulic folder.

In the public folder I will also add a rebots.txt file with information for search engine crawlers, This is giving permission for crawler to search the site and tell them where to find the sitemap.

```
User-agent: *
Allow: / 
Sitemap: https://www.example.co.uk/sitemap.xml
```

## Meta data
To improve the SEO we need to add some mata data tags to our pages that will give extra information about the page and inprove the likelihood of ranking high in search results. Next has a [**Head** component](https://nextjs.org/docs/api-reference/next/head) that makes adding elements to a pages head easy.

**SEO Component** `components/seo/index.tsx`

```
import Head from 'next/head';
import React from 'react';

interface Props {
  title?: string;
  description?: string;
  keywords?: string;
}

const SEOComponent: React.FC<Props> = ({ title, description, keywords }) => (
  <Head>
    <title>{title ? `${title} | Learn by Building` : title}</title>
    <meta
      name="description"
      content={
        description
          ? `Learning by Building - ${description}`
          : 'Learning by Building - Learn tech and improve my software development knowledge while I build this site'
      }
    />
    <meta
      name="keywords"
      content={
        keywords
          ? `keyword, keyword, ${keywords}`
          : 'keyword, keyword'
      }
    />
  </Head>
);

export default SEOComponent;
```

This component can then be added to the article component:

```
<SEOComponent
  title={postData.title}
  description={postData.description}
  keywords={postData.keywords}
/>
```

Or other pages.

The posts/articles are written in **Markdown** see [Basic site](/posts/basic-site) 

These already have title and date, we just need to add description and keywords:

```
---
title: Introduce SEO
date: '2021-04-11'
description: 'This is an article about SEO'
keyword: 'SEO, sitemap, robot.txt'
---
```

### **Resourses I uses while setting this all up:**

[https://medium.com/@joranquinten/generate-a-sitemap-for-your-static-nextjs-website-hosted-on-netlify-4288d5a859a1](https://medium.com/@joranquinten/generate-a-sitemap-for-your-static-nextjs-website-hosted-on-netlify-4288d5a859a1)

[https://frontend-digest.com/how-to-build-a-dynamic-sitemap-for-your-next-js-app-c69836c91f8a](https://frontend-digest.com/how-to-build-a-dynamic-sitemap-for-your-next-js-app-c69836c91f8a)