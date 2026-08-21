export default function PhaseArrows() {
  return (
    <div className="flex h-10 border border-black w-96 text-white font-semibold text-sm leading-10">
      {/* Phase 1 */}
      <div
        className="flex items-center justify-center px-6"
        style={{
          backgroundColor: '#2563eb', // blue-600
          clipPath:
            'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
        }}
      >
        Phase 1
      </div>

    {/* Phase 2 */}
<div
  className="flex items-center justify-center px-6  "
  style={{
    backgroundColor: '#22c55e', // green-500
    clipPath:
      'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
  }}
>
  Phase 2
</div>


{/* Phase 3 */}
<div
  className="flex items-center justify-center z-50 px-6 "
  style={{
    backgroundColor: 'white', // orange-500
    clipPath:
      'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
  }}
>
  Phase 3
</div>
<div
  className="flex items-center fixed bottom-0 left-60 justify-center px-6 -ml-[12px]"
  style={{
    backgroundColor: '#f97316', // orange-500
    clipPath:
      'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
  }}
>
  Phase 3
</div>

    </div>
  );
}
