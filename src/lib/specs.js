import showdown from 'showdown';
import YAML from 'yaml';
import path from 'path';

import { parseFile } from './templater';
import { isJSONFile } from './utils';

// ##################################################################
// This file construct specs objects with:
// - name
// - version
// - description
// - url (for bundle or original mode)
// - file
// - context (for EJS parsing)
// - tags
// ##################################################################

// To generate Markdown syntax to HTML (for displaying API description)
const converter = new showdown.Converter();

export function loadSpecs(config) {
  const specsPromises = config.config.specs.map(async (spec) => {
    let api;
    let raw = parseFile(config.config.folder + '/' + spec.file, spec.context);
    if (isJSONFile(spec.file)) {
      api = JSON.parse(raw, null, 2);
    } else {
      api = YAML.parse(raw);
    }

    return await {
      name: api.info.title,
      version: api.info.version,
      description: converter.makeHtml(api.info.description),
      url: !config.skipBundle
        ? `/raw/bundle/${encodeURIComponent(api.info.title)}.${
            isJSONFile(spec.file) ? 'json' : 'yaml'
          }`
        : `/raw/original/${encodeURIComponent(api.info.title)}/${path.basename(
            spec.file
          )}`,
      file: spec.file,
      context: spec.context,
      tags: api.info['x-tags'] || [],
    };
  });

  return Promise.all(specsPromises);
}
