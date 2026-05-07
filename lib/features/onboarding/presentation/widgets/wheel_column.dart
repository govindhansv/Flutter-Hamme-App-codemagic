import 'package:flutter/cupertino.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class WheelColumn extends StatelessWidget {
  final FixedExtentScrollController controller;
  final int itemCount;
  final int selectedIndex;
  final String Function(int) labelBuilder;
  final ValueChanged<int> onChanged;

  const WheelColumn({
    super.key,
    required this.controller,
    required this.itemCount,
    required this.selectedIndex,
    required this.labelBuilder,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return CupertinoTheme(
      data: const CupertinoThemeData(brightness: Brightness.light),
      child: CupertinoPicker.builder(
        scrollController: controller,
        itemExtent: 44,
        onSelectedItemChanged: onChanged,
        selectionOverlay: const SizedBox.shrink(),
        squeeze: 1.0,
        magnification: 1.15,
        useMagnifier: true,
        childCount: itemCount,
        itemBuilder: (context, index) {
          final isSelected = index == selectedIndex;
          return Center(
            child: Text(
              labelBuilder(index),
              style: TextStyle(
                fontFamily: TFonts.nunito,
                fontSize: isSelected ? 17 : 15,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                color: isSelected ? TColors.black : TColors.darkGrey,
              ),
            ),
          );
        },
      ),
    );
  }
}
