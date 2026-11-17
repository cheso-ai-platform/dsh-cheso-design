import de from '../../locale/de.json';
import en from '../../locale/en.json';
import es from '../../locale/es.json';
import fr from '../../locale/fr.json';
import ja from '../../locale/ja.json';
import pt from '../../locale/pt.json';
import ru from '../../locale/ru.json';
import zh from '../../locale/zh.json';

export const localeNamespace = 'dsh-cheso-design';

// 英文词条定义键集合，下方的类型检查会发现任何语言缺少的词条。
export type MessageKey = keyof typeof en.messages;
export type MessageParams = Record<string, string | number>;
export type Translate = (key: MessageKey, params?: MessageParams) => string;
export type TranslatedProps = { t: Translate };

export const dictionaries = {
  de: de.messages,
  en: en.messages,
  es: es.messages,
  fr: fr.messages,
  ja: ja.messages,
  pt: pt.messages,
  ru: ru.messages,
  zh: zh.messages,
} satisfies Record<string, Record<MessageKey, string>>;
