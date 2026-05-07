import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class PlayingFriendsRow extends StatelessWidget {
  const PlayingFriendsRow({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 110,
      height: 30,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 0,
            top: 7,
            child: _FriendDot(label: '', color: Color(0xFF00FF1A), size: 10),
          ),
          Positioned(
            left: 15,
            child: _FriendDot(label: 'S', color: Color(0xFFFF4B92)),
          ),
          Positioned(
            left: 33,
            child: _FriendDot(label: 'K', color: Color(0xFF20D26B)),
          ),
          Positioned(
            left: 51,
            child: _FriendDot(label: 'R', color: Color(0xFF38A7FF)),
          ),
          Positioned(
            left: 69,
            child: _FriendDot(label: 'N', color: Color(0xFFFFD13A)),
          ),
          Positioned(
            left: 87,
            child: _FriendDot(label: 'A', color: Color(0xFFFF5A5A)),
          ),
        ],
      ),
    );
  }
}

class _FriendDot extends StatelessWidget {
  const _FriendDot({required this.label, required this.color, this.size = 22});

  final String label;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 1),
      ),
      child:
          label.isEmpty
              ? null
              : Text(
                label,
                style: const TextStyle(
                  fontFamily: TFonts.nunito,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  color: Colors.white,
                ),
              ),
    );
  }
}
