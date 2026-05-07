import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hamme_app/features/home/domain/models/share_instruction_data.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class ShareInstructionTitle extends StatelessWidget {
  const ShareInstructionTitle({super.key, required this.data});

  final ShareInstructionData data;

  @override
  Widget build(BuildContext context) {
    if (data.highlight.isEmpty) {
      return Text(
        data.prefix,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontFamily: TFonts.nunito,
          fontWeight: FontWeight.w800,
          fontSize: 24,
          color: Colors.black,
        ),
      );
    }

    if (data.highlight == 'LINK') {
      return Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text(data.prefix, style: _titleStyle),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF168BFF)),
              borderRadius: BorderRadius.circular(5),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(CupertinoIcons.link, color: Color(0xFF168BFF), size: 22),
                SizedBox(width: 2),
                Text(
                  'LINK',
                  style: TextStyle(
                    fontFamily: TFonts.nunito,
                    fontWeight: FontWeight.w800,
                    fontSize: 21,
                    color: Color(0xFF168BFF),
                  ),
                ),
              ],
            ),
          ),
          Text(data.suffix, style: _titleStyle),
        ],
      );
    }

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(data.prefix, style: _titleStyle),
        Container(
          width: 35,
          height: 32,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.black, width: 2),
            borderRadius: BorderRadius.circular(9),
          ),
          child: const Icon(
            CupertinoIcons.smiley,
            size: 22,
            color: Colors.black,
          ),
        ),
        Text(data.suffix, style: _titleStyle),
      ],
    );
  }

  static const _titleStyle = TextStyle(
    fontFamily: TFonts.nunito,
    fontWeight: FontWeight.w800,
    fontSize: 24,
    color: Colors.black,
  );
}
