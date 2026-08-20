import { GreetingContent, OptionalPart } from './types';

/**
 * What the recipient actually sees.
 *
 * The editor keeps every part the AI wrote, switched on or off; this is the
 * single place that turns those switches into rendered output. Filtering
 * here rather than in `toPublicGreeting` is deliberate — the public shape is
 * also what an owner re-opens to edit, and stripping text there would turn
 * "unchecked" into "deleted" the next time they saved.
 */

export function isPartHidden(content: GreetingContent, part: OptionalPart): boolean {
  return (content.hiddenParts ?? []).includes(part);
}

/**
 * A copy of the content with every switched-off part emptied out. Emptied,
 * not deleted: `intro` and `closing` are required strings in the schema, and
 * every scene already treats an empty value as "nothing to render".
 */
export function visibleContent(content: GreetingContent): GreetingContent {
  return {
    ...content,
    intro: isPartHidden(content, 'intro') ? '' : content.intro,
    closing: isPartHidden(content, 'closing') ? '' : content.closing,
    surprise: isPartHidden(content, 'surprise') ? '' : (content.surprise ?? ''),
    messages: isPartHidden(content, 'messages') ? [] : (content.messages ?? []),
    sections: content.sections.filter((section) => !section.hidden),
  };
}
