
import { Stethoscope, Twitter, Facebook, Linkedin, Youtube, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
];

const usefulLinks = [
    { name: 'Sobre Nosotros', href: '#about' },
    { name: 'Servicios', href: '#services' },
    { name: 'Departamentos', href: '#departments' },
    { name: 'Doctores', href: '#doctors' },
]

export default function Footer() {
    return (
        <footer id="contact" className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo & Description */}
                    <div className="space-y-4">
                        <Link href="/landing" className="flex items-center gap-2 font-bold text-lg">
                            <Image
                                src="/images/logo/urovital-logo.png"
                                alt="UroVital"
                                width={153}
                                height={55}
                                className="h-[55px] w-[153px] object-contain"
                                priority
                            />
                        </Link>
                        <p className="text-sm">
                            Ofrecemos atención médica de primera clase con un equipo de especialistas dedicados a tu bienestar.
                        </p>
                        <div className="flex items-center gap-2">
                            {socialLinks.map(link => {
                                const Icon = link.icon;
                                return (
                                    <Button key={link.name} variant="ghost" size="icon" asChild>
                                        <Link href={link.href} aria-label={link.name}>
                                            <Icon className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                     {/* Useful Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Enlaces Útiles</h4>
                        <ul className="space-y-2 text-sm">
                            {usefulLinks.map(link => (
                                <li key={link.name}>
                                    <Link href={link.href} className="hover:text-primary transition-colors">{link.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                     {/* Contact Info */}
                     <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Contacto</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Valencia, Edo. Carabobo</li>
                            <li>info@urovital.com</li>
                            <li>+58 412-177 2206</li>
                        </ul>
                    </div>
                    {/* Newsletter */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Boletín</h4>
                         <p className="text-sm">Suscríbete para recibir noticias y ofertas.</p>
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input type="email" placeholder="Email" className="bg-background" />
                            <Button type="submit" size="icon">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm">
                    &copy; {new Date().getFullYear()} UroVital. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    )
}
