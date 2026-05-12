drop table if exists livros cascade;
drop table if exists usuarios cascade;
drop type if exists livro_status cascade;

create type livro_status as enum ('lendo', 'quero ler', 'lido', 'abandonado');

create table usuarios(
    id uuid primary key default gen_random_uuid(),
    nome varchar(255) not null,
    email varchar(255) not null unique,
    senha varchar(255) not null
);

create table livros(
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null unique,
    google_books_id varchar(255) unique,
    titulo text not null,
    autores text[],
    isbn varchar(20),
    ano_publicacao int,
    capa_url text,
    idioma varchar(50),
    n_paginas int,
    status livro_status not null default 'quero ler',
    data_adicionado timestamp with time zone default current_timestamp,
    data_concluido timestamp with time zone,
    foreign key (usuario_id) references usuarios(id) on delete cascade
);