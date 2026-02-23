using System.Text.RegularExpressions;
using AnPhucNienSo.Api.DTOs;

namespace AnPhucNienSo.Api.Services;

/// <summary>
/// Parses raw text (from OCR or manual paste) into structured member data.
/// Supports both free-form text and tabular "Sổ Cầu An/Siêu" format.
/// </summary>
public partial class TextParserService
{
    public ImportParseResult Parse(string text, int? currentYear = null)
    {
        if (string.IsNullOrWhiteSpace(text))
            return new ImportParseResult();

        var result = new ImportParseResult();
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        int calcYear = currentYear ?? DateTime.Now.Year;

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (line.Length < 3)
                continue;

            TryExtractHeader(line, result);

            var member = ParseLine(line, calcYear);
            if (member is not null)
                result.Members.Add(member);
        }

        return result;
    }

    private static void TryExtractHeader(string line, ImportParseResult result)
    {
        if (result.HeadOfHouseholdName is null)
        {
            var headMatch = HeadOfHouseholdRegex().Match(line);
            if (headMatch.Success)
            {
                result.HeadOfHouseholdName = headMatch.Groups["name"].Value.Trim();
                return;
            }
        }

        if (result.Address is null)
        {
            var addrMatch = AddressRegex().Match(line);
            if (addrMatch.Success)
            {
                result.Address = addrMatch.Groups["addr"].Value.Trim();
                return;
            }
        }
    }

    private ParsedMemberDto? ParseLine(string line, int calcYear)
    {
        var remaining = line;

        if (IsHeaderLine(remaining))
            return null;

        // Try tabular format: STT | Name | DharmaName | Age | Sao | Han
        var tableMatch = TableRowRegex().Match(remaining);
        if (tableMatch.Success)
        {
            return ParseTableRow(tableMatch, calcYear);
        }

        // Fallback: free-form line parsing
        return ParseFreeFormLine(remaining, calcYear);
    }

    private static ParsedMemberDto? ParseTableRow(Match m, int calcYear)
    {
        var name = m.Groups["name"].Value.Trim();
        var dharma = m.Groups["dharma"].Value.Trim();
        var ageStr = m.Groups["age"].Value.Trim();

        if (string.IsNullOrWhiteSpace(name))
            return null;

        name = CleanName(name);
        if (string.IsNullOrWhiteSpace(name))
            return null;

        int? birthYear = null;
        if (int.TryParse(ageStr, out var age) && age > 0 && age < 200)
        {
            birthYear = calcYear - age + 1;
        }

        bool? gender = DetectGenderFromName(name);

        return new ParsedMemberDto
        {
            Name = name,
            BirthYear = birthYear,
            Gender = gender,
            DharmaName = string.IsNullOrWhiteSpace(dharma) ? null : dharma,
            IsAlive = true,
        };
    }

    private ParsedMemberDto? ParseFreeFormLine(string remaining, int calcYear)
    {
        // 1. Extract birth year — "SN 1990", "sinh năm 1985", or bare "1990"
        int? birthYear = null;
        var yearMatch = YearPrefixedRegex().Match(remaining);
        if (yearMatch.Success)
        {
            birthYear = int.Parse(yearMatch.Groups["y"].Value);
            remaining = remaining.Remove(yearMatch.Index, yearMatch.Length);
        }
        else
        {
            var bareYear = BareYearRegex().Match(remaining);
            if (bareYear.Success)
            {
                birthYear = int.Parse(bareYear.Groups["y"].Value);
                remaining = remaining.Remove(bareYear.Index, bareYear.Length);
            }
        }

        // 1b. If no birth year, try extracting age (1-3 digit number)
        if (birthYear is null)
        {
            var ageMatch = StandaloneAgeRegex().Match(remaining);
            if (ageMatch.Success)
            {
                var age = int.Parse(ageMatch.Groups["a"].Value);
                if (age > 0 && age < 200)
                {
                    birthYear = calcYear - age + 1;
                    remaining = remaining.Remove(ageMatch.Index, ageMatch.Length);
                }
            }
        }

        // 2. Extract gender — Nam / Nữ / Male / Female
        bool? gender = null;
        var genderMatch = GenderRegex().Match(remaining);
        if (genderMatch.Success)
        {
            var g = genderMatch.Value.Trim().ToLowerInvariant();
            gender = g is "nam" or "male";
            remaining = remaining.Remove(genderMatch.Index, genderMatch.Length);
        }

        // 3. Extract dharma name — "PD: Thiện Đức", "Pháp danh: ..."
        string? dharmaName = null;
        var dharmaMatch = DharmaNameRegex().Match(remaining);
        if (dharmaMatch.Success)
        {
            dharmaName = dharmaMatch.Groups["dn"].Value.Trim();
            remaining = remaining.Remove(dharmaMatch.Index, dharmaMatch.Length);
        }

        // 4. Extract alive status — "đã mất", "mất", "qua đời"
        bool isAlive = true;
        var deceasedMatch = DeceasedRegex().Match(remaining);
        if (deceasedMatch.Success)
        {
            isAlive = false;
            remaining = remaining.Remove(deceasedMatch.Index, deceasedMatch.Length);
        }

        // 5. Whatever is left is the name
        var name = CleanupDelimitersRegex().Replace(remaining, " ").Trim();
        name = CollapseWhitespaceRegex().Replace(name, " ");
        name = CleanName(name);

        if (string.IsNullOrWhiteSpace(name) && birthYear is null)
            return null;

        gender ??= DetectGenderFromName(name ?? "");

        return new ParsedMemberDto
        {
            Name = string.IsNullOrWhiteSpace(name) ? null : name,
            BirthYear = birthYear,
            Gender = gender,
            DharmaName = dharmaName,
            IsAlive = isAlive
        };
    }

    private static bool? DetectGenderFromName(string name)
    {
        var lower = name.ToLowerInvariant();
        var words = lower.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Any(w => w is "thị" or "thi")) return false;
        if (words.Any(w => w is "văn" or "van")) return true;
        return null;
    }

    private static string CleanName(string name)
    {
        // Remove leading STT numbers like "1.", "1 ", "10."
        name = LeadingNumberRegex().Replace(name, "").Trim();
        // Remove trailing Sao/Han text
        name = TrailingSaoHanRegex().Replace(name, "").Trim();
        return name;
    }

    private static bool IsHeaderLine(string line)
    {
        var lower = line.ToLowerInvariant();
        return lower.Contains("stt") && (lower.Contains("họ tên") || lower.Contains("ho ten"))
            || lower.Contains("ban trị sự")
            || lower.Contains("chùa") && lower.Contains("sổ cầu")
            || lower.Contains("sổ cầu an") || lower.Contains("sổ cầu siêu")
            || lower.Contains("trại chủ") || lower.Contains("trai chu")
            || lower.Contains("pháp danh") && lower.Contains("tuổi") && lower.Contains("sao")
            || lower.Contains("địa chỉ") && !lower.Contains(",");
    }

    // ── Regex patterns ──────────────────────────────────────────────────

    [GeneratedRegex(@"(?i)(?:tr[aạ]i\s*ch[uủ]|gia\s*ch[uủ])\s*[:\-]?\s*(?<name>[A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:\s*(?:t[oổ]|$))", RegexOptions.IgnoreCase)]
    private static partial Regex HeadOfHouseholdRegex();

    [GeneratedRegex(@"(?i)(?:[dđ][iị]a\s*ch[iỉ])\s*[:\-]?\s*(?<addr>.+)", RegexOptions.IgnoreCase)]
    private static partial Regex AddressRegex();

    [GeneratedRegex(@"^\s*\d{1,2}\s+(?<name>[A-ZÀ-Ỹa-zà-ỹ\s]{3,}?)\s{2,}(?<dharma>[A-ZÀ-Ỹa-zà-ỹ\s]*?)\s+(?<age>\d{1,3})\s")]
    private static partial Regex TableRowRegex();

    [GeneratedRegex(@"^\d{1,3}[\.\)\s]+")]
    private static partial Regex LeadingNumberRegex();

    [GeneratedRegex(@"(?i)\s+(?:Th[uủ]y\s*Di[eệ]u|Th[aá]i\s*(?:B[aạ]ch|D[uư][oơ]ng|[AÂ]m)|M[oộ]c\s*[DĐ][uứ]c|V[aâ]n\s*H[oớ]n|K[eế]\s*[DĐ][oồ]|La\s*H[aầ]u|Th[oổ]\s*T[uú]|B[iì]nh\s*An|Hu[yỳ]nh\s*Tuy[eề]n|Thi[eê]n\s*(?:Tinh|La)|T[aá]n\s*T[aậ]n|To[aá]n\s*T[aậ]n|[DĐ][iị]a\s*V[oõ]ng|Di[eê]m\s*V[uư][oơ]ng|Tam\s*Keo|Ng[uũ]\s*H[aạ]).*$")]
    private static partial Regex TrailingSaoHanRegex();

    [GeneratedRegex(@"(?i)(?:SN|sinh\s*n[aă]m|sinh)\s*(?<y>(?:19|20)\d{2})", RegexOptions.IgnoreCase)]
    private static partial Regex YearPrefixedRegex();

    [GeneratedRegex(@"\b(?<y>(?:19|20)\d{2})\b")]
    private static partial Regex BareYearRegex();

    [GeneratedRegex(@"\b(?<a>\d{1,3})\b")]
    private static partial Regex StandaloneAgeRegex();

    [GeneratedRegex(@"\b(?:Nam|N[uữ]|Male|Female)\b", RegexOptions.IgnoreCase)]
    private static partial Regex GenderRegex();

    [GeneratedRegex(@"(?i)(?:PD|Ph[aá]p\s*[Dd]anh)\s*[:\-]?\s*(?<dn>[A-ZÀ-Ỹa-zà-ỹ\s]+?)(?=[,;\-|]|$)")]
    private static partial Regex DharmaNameRegex();

    [GeneratedRegex(@"(?i)\b(?:[dđ][aã]\s*m[aấ]t|m[aấ]t|qua\s*[dđ][oờ]i|qu[aá]\s*v[aã]ng)\b")]
    private static partial Regex DeceasedRegex();

    [GeneratedRegex(@"[,;\-–—|/]+")]
    private static partial Regex CleanupDelimitersRegex();

    [GeneratedRegex(@"\s{2,}")]
    private static partial Regex CollapseWhitespaceRegex();
}

public class ImportParseResult
{
    public string? HeadOfHouseholdName { get; set; }
    public string? Address { get; set; }
    public List<ParsedMemberDto> Members { get; set; } = [];
}
