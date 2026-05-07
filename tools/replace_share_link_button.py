from PIL import Image, ImageDraw, ImageFont
import os
path = r"assets/images/share_link_button.png"
os.makedirs(os.path.dirname(path), exist_ok=True)
W, H = 700, 560
img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 34)
except Exception:
    font_bold = ImageFont.load_default()
card = (42, 68, 660, 490)
d.rounded_rectangle(card, radius=28, fill=(130, 69, 36, 255))
for y in range(card[1], card[3]):
    for x in range(card[0], card[2]):
        nx = (x - card[0]) / (card[2] - card[0])
        ny = (y - card[1]) / (card[3] - card[1])
        r = int(70 + 90 * nx + 28 * (1 - ny))
        g = int(42 + 31 * nx + 18 * (1 - ny))
        b = int(25 + 13 * nx)
        if 42 <= x <= 660 and 68 <= y <= 490:
            img.putpixel((x, y), (r, g, b, 255))
d = ImageDraw.Draw(img)
d.rounded_rectangle(card, radius=28, outline=None, fill=None)
def circle(cx, cy, radius, fill):
    d.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), fill=fill)
circle(112, 134, 34, (43, 25, 18, 210))
d.line((122, 119, 105, 134, 122, 149), fill="white", width=6, joint="curve")
circle(306, 134, 34, (79, 45, 30, 205))
d.text((285, 115), "Aa", font=font_bold, fill="white")
circle(400, 134, 34, (104, 124, 160, 255))
d.ellipse((384, 118, 416, 150), outline="white", width=4)
d.ellipse((392, 128, 397, 133), fill="white")
d.ellipse((403, 128, 408, 133), fill="white")
d.arc((391, 130, 409, 144), 20, 160, fill="white", width=3)
circle(492, 134, 34, (111, 58, 33, 210))
d.polygon([(491,112),(498,129),(515,136),(498,143),(491,160),(484,143),(467,136),(484,129)], fill="white")
d.polygon([(513,107),(517,117),(527,121),(517,125),(513,135),(509,125),(499,121),(509,117)], fill="white")
circle(586, 134, 34, (105, 55, 33, 215))
for cx in (574, 586, 598):
    circle(cx, 134, 4, "white")
d.ellipse((262, 238, 432, 408), fill=(190, 148, 124, 255), outline="white", width=7)
d.rounded_rectangle((455, 202, 502, 258), radius=23, fill=None, outline="white", width=7)
d.rectangle((475, 229, 482, 314), fill="white")
d.polygon([(478, 270), (506, 249), (538, 262), (547, 290), (537, 359), (465, 359), (460, 310)], fill="white")
d.rounded_rectangle((458, 304, 542, 374), radius=16, fill="white")
img.save(path)
