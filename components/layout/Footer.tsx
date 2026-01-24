import Image from 'next/image'

export const Footer = () => {
  return (
    <footer className="mt-auto backdrop-blur-2xl bg-black/30 border-t border-white/10">
      <div className="py-4 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
          <a
            href="https://discord.com/"
            aria-label="Discord"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-500/30 hover:border-indigo-400 transition"
          >
            D
          </a>
          <a
            href="https://x.com/"
            aria-label="Twitter"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-sky-500/30 hover:border-sky-400 transition"
          >
            X
          </a>
          <a
            href="#"
            aria-label="Website"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500/30 hover:border-emerald-400 transition"
          >
            <Image src="/globe.svg" alt="Website" width={18} height={18} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  )
}
