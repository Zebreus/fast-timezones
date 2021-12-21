type MonthName = "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct" | "Dec"
type WeekdayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
type DayOfMonth = `${"" | "1" | "2"}${"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"}` | "30" | "31"
type HourOfDay = `${"" | "1"}${"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"}` | "20" | "21" | "23"
type MinuteOfHour = `${"0" | "1" | "2" | "3" | "4" | "5"}${"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"}`
type TimeOfDay = `${HourOfDay}:${MinuteOfHour}`
type SavingTime = `${"0" | "1"}:${MinuteOfHour}` | "0"

/**
 * A rule is applied every year between from and to.
 * When a rule is applied, it sets the daylight saving and the letter.
 */
interface Rule {
  name: string
  /** First calendar year in which the rule is applied */
  from: string // TODO maybe number
  /** Last calendar year the rule applies.
   * "only" if it only applies to one year
   * "max" if it applies to all remaining years
   */
  to: string
  /** Month in which the rule is applied */
  in: MonthName
  /** Day of the month on which the rule is applied.
   * number if day of the month
   * "lastSun" if last sunday of month
   * "firstSun" if first sunday of month
   * "Sun>=x" where x the day of the month. The first Sunday on or after the xth of the month.
   * "Sun<=x" where x the day of the month. The last Sunday on or before the xth of the month.
   */
  on:
    | number
    | `last${WeekdayName}`
    | `first${WeekdayName}`
    | `${WeekdayName}>=${DayOfMonth}`
    | `${WeekdayName}<=${DayOfMonth}`
  /** The time of the day on which the rule is applied
   * No suffix indicates local time
   * suffix "s" means local time without daylight saving
   * suffix "g" "u" or "z" mean UTC
   * suffix "w" means the same as no suffix
   */
  at: `${TimeOfDay}${"" | "s" | "g" | "u" | "z" | "w"}`
  /** The daylight saving is set to this value, when the rule is appliedd
   * Either `HOUR:MINUTE` or "0"
   */
  save: `${SavingTime}`
  /**
   * A single letter or nothing. I think.
   */
  letter?: string
}

/**
 * A timezone
 */
interface Zone {
  /** The name of the timezone */
  name: string
  /** The standart offset from utc */
  offset: string
  /** The rule name that affects this zone */
  rule?: string
  /** Abbreviation of the timezone
   * A string of three characters
   * An array of two strings, the second one is used, when daylight saving is active
   * The string can contain %s which is replaced by the letter from rule
   */
  abbreviation: string
  /** A string in localtime indicating until this zone is valid
   * Undefined, if the zone is valid indefinitly
   */
  until?: string
}

interface Link {
  /** The name of the link/alias */
  name: string
  /** The name of the real timezone (or another link) */
  real: string
}

interface Token {
  line: number
  column: number
  token: string
}

function TokenError(token: Token | undefined, message: string): never {
  throw new Error(
    `${token?.line ?? "??"}:${token?.column ?? "??"} Error parsing '${
      token?.token?.replace("\n", "\\n") ?? "??"
    }': ${message}`
  )
}

export function parseRules(content: Buffer) {
  const tokens = tokenize(content)
  let lastToken: Token | undefined

  let results = {
    rules: [] as Rule[],
    zones: [] as Zone[],
    links: [] as Link[],
  }

  let index = 0

  const consumeToken = () => {
    if (index >= tokens.length) {
      TokenError(lastToken, "No more tokens available")
    }
    lastToken = tokens[index++]
    lastToken.line > 1500 && console.log(lastToken)
    return lastToken
  }

  let zoneName: Token | undefined

  while (index < tokens.length) {
    const token = consumeToken()
    switch (token.token) {
      case "Rule":
        zoneName = undefined
        results.rules.push(parseRule(consumeToken))
        break
      case "Zone":
        if (!zoneName) {
          zoneName = consumeToken()
        }
        results.zones.push(parseZone(consumeToken, zoneName))
        break
      case "Link":
        zoneName = undefined
        results.links.push(parseLink(consumeToken))
        break
      default:
        if (zoneName) {
          // Modify old tokens to pretend there was a zone header
          index = index - 2
          tokens[index].token = "Zone"
          break
        }
        TokenError(token, "Unexpected token")
    }
  }
  return results
}

function parseLink(consumeToken: () => Token) {
  const name = consumeToken()
  const real = consumeToken()
  const newline = consumeToken()
  return {
    name: name.token,
    real: real.token,
  } as Link
}

function parseZone(consumeToken: () => Token, name: Token) {
  const offset = consumeToken()
  const ruleToken = consumeToken()
  const rule = ruleToken.token !== "-" ? ruleToken : undefined
  const abbreviation = consumeToken()

  let until: string | undefined = ""
  let token = consumeToken()
  while (token.token !== "\n") {
    until += token.token
    token = consumeToken()
  }
  until = until || undefined

  return {
    name: name.token,
    offset: offset.token,
    rule: rule?.token,
    abbreviation: abbreviation.token,
    until: until,
  } as Zone
}

function parseRule(consumeToken: () => Token) {
  const name = consumeToken()
  const from = consumeToken()
  const to = consumeToken()
  const hyphen = consumeToken()
  const month = consumeToken()
  const day = consumeToken()
  const hour = consumeToken()
  const save = consumeToken()
  const letter = consumeToken()
  const newline = consumeToken()
  return {
    name: name.token,
    from: from.token,
    to: to.token,
    in: month.token,
    on: day.token,
    at: hour.token,
    save: save.token,
    letter: letter.token,
  } as Rule
}

/** Remove comments and tokenize */
function tokenize(content: Buffer) {
  return content
    .toString()
    .replace(/#[^\n]*/g, "")
    .split("\n")
    .flatMap((line, lineIndex) => {
      const tokensInLine = line
        .split(/\s+/)
        .filter(token => !!token)
        .map((token, tokenIndex) => ({ line: lineIndex + 1, column: tokenIndex + 1, token: token }))
      return tokensInLine.length
        ? [...tokensInLine, { line: lineIndex + 1, column: tokensInLine.length, token: "\n" }]
        : []
    })
}
