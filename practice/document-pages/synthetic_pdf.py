"""Optional approved-fixture builder. Produces no file and runs nothing on import."""
from io import BytesIO


def fixture():
    from reportlab.pdfgen.canvas import Canvas
    output = BytesIO()
    canvas = Canvas(output, pagesize=(300, 300))
    canvas.drawString(30, 250, 'SYNTHETIC DATA ONLY')
    canvas.drawString(30, 210, 'Exposure table: values in USD')
    canvas.drawString(30, 180, 'Desk / Exposure')
    canvas.showPage()
    canvas.drawString(30, 250, 'Exposure continued from page 1')
    canvas.drawString(30, 210, 'Rates / 125.00')
    canvas.save()
    return output.getvalue()
