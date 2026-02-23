using Tesseract;

namespace AnPhucNienSo.Api.Services;

public class OcrService
{
    private readonly string _tessDataPath;
    private readonly ILogger<OcrService> _logger;

    public OcrService(IConfiguration config, ILogger<OcrService> logger)
    {
        _logger = logger;
        _tessDataPath = config["Ocr:TessDataPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "tessdata");
    }

    public string ExtractText(Stream imageStream)
    {
        if (!Directory.Exists(_tessDataPath))
        {
            throw new InvalidOperationException(
                $"Tessdata directory not found at '{_tessDataPath}'. " +
                "Download trained data from https://github.com/tesseract-ocr/tessdata " +
                "and place vie.traineddata + eng.traineddata in the tessdata folder.");
        }

        var imageBytes = ReadAllBytes(imageStream);

        using var engine = new TesseractEngine(_tessDataPath, "vie+eng", EngineMode.Default);

        engine.SetVariable("tessedit_pageseg_mode", "6"); // Assume uniform block of text
        engine.SetVariable("preserve_interword_spaces", "1");

        using var pix = Pix.LoadFromMemory(imageBytes);
        using var page = engine.Process(pix);

        var text = page.GetText();
        var confidence = page.GetMeanConfidence() * 100;
        _logger.LogInformation("OCR confidence: {Confidence:F1}%, text length: {Len}", confidence, text.Length);

        return text;
    }

    private static byte[] ReadAllBytes(Stream stream)
    {
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        return ms.ToArray();
    }
}
