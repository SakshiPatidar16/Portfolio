import React from 'react'

export default function Hero() {
  return (
    <section className="py-20 text-center hero-gradient">
      <div className="container max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 hero-title">Crafting visual stories<br /><span className="text-5xl md:text-6xl heading-gradient">that inspire</span></h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">Transforming ideas into captivating digital experiences through design and code.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="#projects" className="btn">View My Work</a>
          <a href="#contact" className="btn-outline">Get In Touch</a>
        </div>
      </div>
    </section>
  )
}
